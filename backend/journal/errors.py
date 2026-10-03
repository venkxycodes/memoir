from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


class EntryNotFound(APIException):
    status_code = 404
    default_detail = "Entry not found."
    default_code = "entry_not_found"


class EntryConflict(APIException):
    status_code = 409
    default_detail = "An entry already exists for this date."
    default_code = "entry_conflict"


def exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        return None
    if isinstance(exc, (EntryNotFound, EntryConflict)):
        response.data = {
            "error": {"code": exc.default_code, "message": str(exc.detail)}
        }
    else:
        message = (
            "Invalid request."
            if response.status_code == 400
            else "Request could not be completed."
        )
        response.data = {
            "error": {
                "code": "invalid_request"
                if response.status_code == 400
                else "request_error",
                "message": message,
                "details": response.data,
            }
        }
    return response
