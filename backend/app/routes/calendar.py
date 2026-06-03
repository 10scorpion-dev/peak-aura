"""Read-only Google Calendar OAuth routes for the local MVP."""

import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session

from app import crud
from app.config import (
    FRONTEND_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
)
from app.database import get_session
from app.models import GoogleCalendarConnection
from app.schemas import GoogleCalendarStatusRead

GOOGLE_CALENDAR_READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly"
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

oauth_state_store: dict[str, dict[str, str | None]] = {}

router = APIRouter(prefix="/calendar/google", tags=["Google Calendar"])


def _ensure_google_oauth_config() -> None:
    """Ensure the local Google OAuth env vars exist before starting the flow."""
    missing = [
        name
        for name, value in {
            "GOOGLE_CLIENT_ID": GOOGLE_CLIENT_ID,
            "GOOGLE_CLIENT_SECRET": GOOGLE_CLIENT_SECRET,
            "GOOGLE_REDIRECT_URI": GOOGLE_REDIRECT_URI,
        }.items()
        if not value
    ]

    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Missing Google OAuth environment variables: {', '.join(missing)}",
        )


def _get_google_flow():
    """Create a local Google OAuth flow from env vars.

    Imports are kept inside this helper so the backend can still boot before the
    optional Google dependencies are installed.
    """
    try:
        from google_auth_oauthlib.flow import Flow
    except ImportError as error:  # pragma: no cover - runtime dependency check
        raise HTTPException(
            status_code=500,
            detail=(
                "Google OAuth dependencies are not installed yet. "
                "Install backend requirements to enable calendar connection."
            ),
        ) from error

    _ensure_google_oauth_config()

    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "project_id": "peak-aura-lite-local",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uris": [GOOGLE_REDIRECT_URI],
            "javascript_origins": [FRONTEND_URL],
        }
    }

    return Flow, client_config


def _build_google_flow(
    *,
    state: str | None = None,
    autogenerate_code_verifier: bool = True,
):
    """Create a Google OAuth flow with consistent local settings."""
    Flow, client_config = _get_google_flow()
    return Flow.from_client_config(
        client_config,
        scopes=[GOOGLE_CALENDAR_READONLY_SCOPE],
        redirect_uri=GOOGLE_REDIRECT_URI,
        state=state,
        autogenerate_code_verifier=autogenerate_code_verifier,
    )


@router.get("/status", response_model=GoogleCalendarStatusRead)
def google_calendar_status(
    session: Session = Depends(get_session),
) -> GoogleCalendarStatusRead:
    """Return whether a local Google Calendar connection exists."""
    connection = crud.get_google_calendar_connection(session)
    return GoogleCalendarStatusRead(connected=connection is not None)


@router.get("/connect")
def connect_google_calendar() -> RedirectResponse:
    """Redirect the user to Google's read-only Calendar OAuth consent screen."""
    flow = _build_google_flow()
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    oauth_state_store[state] = {
        "code_verifier": flow.code_verifier,
    }
    return RedirectResponse(url=authorization_url, status_code=307)


@router.get("/callback")
def google_calendar_callback(
    request: Request,
    code: str | None = Query(default=None),
    error: str | None = Query(default=None),
    state: str | None = Query(default=None),
    session: Session = Depends(get_session),
) -> RedirectResponse:
    """Handle the OAuth callback, store the read-only tokens, and return home."""
    if error:
        raise HTTPException(status_code=400, detail=f"Google OAuth error: {error}")

    if not code:
        raise HTTPException(status_code=400, detail="Missing Google OAuth code")

    if not state or state not in oauth_state_store:
        raise HTTPException(
            status_code=400,
            detail="OAuth state expired or missing. Please reconnect Google Calendar.",
        )

    flow_state = oauth_state_store[state]
    flow = _build_google_flow(state=state, autogenerate_code_verifier=False)
    flow.code_verifier = flow_state["code_verifier"]

    try:
        flow.fetch_token(authorization_response=str(request.url))
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail="Google OAuth token exchange failed. Please try reconnecting.",
        ) from error

    credentials = flow.credentials
    oauth_state_store.pop(state, None)

    connection = crud.get_google_calendar_connection(session)
    now = datetime.now()

    if connection is None:
        connection = GoogleCalendarConnection(
            provider="google",
            access_token=credentials.token,
            refresh_token=credentials.refresh_token,
            token_uri=credentials.token_uri,
            client_id=credentials.client_id,
            client_secret=credentials.client_secret,
            scopes=" ".join(credentials.scopes or [GOOGLE_CALENDAR_READONLY_SCOPE]),
            expiry=credentials.expiry,
            created_at=now,
            updated_at=now,
        )
    else:
        connection.access_token = credentials.token
        connection.refresh_token = credentials.refresh_token or connection.refresh_token
        connection.token_uri = credentials.token_uri
        connection.client_id = credentials.client_id
        connection.client_secret = credentials.client_secret
        connection.scopes = " ".join(credentials.scopes or [GOOGLE_CALENDAR_READONLY_SCOPE])
        connection.expiry = credentials.expiry
        connection.updated_at = now

    session.add(connection)
    session.commit()

    return RedirectResponse(url=FRONTEND_URL, status_code=307)
