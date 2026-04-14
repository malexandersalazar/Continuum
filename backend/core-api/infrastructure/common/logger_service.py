"""LoggerService implementation using Python's built-in logging module with JSON formatting."""

import os
import time
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler

from pythonjsonlogger.json import JsonFormatter


class LoggerService:
    """A logging service that writes logs to both console and file in JSON format."""

    def __init__(self, log_level: str, log_dir: str, name: str):
        self.logger = logging.getLogger(name)
        self.log_level = getattr(logging, log_level.upper())
        self.log_dir = log_dir
        self.__configure_logger()

    def __configure_logger(self):
        if self.logger.hasHandlers():
            self.logger.handlers.clear()

        # Create logs directory if it doesn't exist
        if not os.path.exists(self.log_dir):
            os.makedirs(self.log_dir, exist_ok=True)

        # Configure file handler
        log_file = os.path.join(
            self.log_dir, f'app_{datetime.now().strftime("%Y%m%d")}.log'
        )
        file_handler = RotatingFileHandler(
            log_file, maxBytes=1024 * 1024, backupCount=10  # 1MB
        )
        file_handler.setLevel(self.log_level)

        # Configure console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(self.log_level)

        # Create formatter
        formatter = JsonFormatter(
            "%(asctime)s %(levelname)s %(name)s %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%SZ",
        )
        formatter.converter = time.gmtime
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)

        # Add handlers to logger
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
        self.logger.setLevel(self.log_level)

    def _log(self, level: str, message: str, extra: dict | None = None):
        """Internal method to handle logging with extra context and level."""
        log_method = getattr(self.logger, level.lower())
        log_method(message, extra=extra)

    def info(self, message: str, extra: dict | None = None):
        """Log an info message with optional extra context."""
        self._log("INFO", message, extra)

    def error(self, message: str, extra: dict | None = None):
        """Log an error message with optional extra context."""
        self._log("ERROR", message, extra)

    def warning(self, message: str, extra: dict | None = None):
        """Log a warning message with optional extra context."""
        self._log("WARNING", message, extra)

    def debug(self, message: str, extra: dict | None = None):
        """Log a debug message with optional extra context."""
        self._log("DEBUG", message, extra)

    def critical(self, message: str, extra: dict | None = None):
        """Log a critical message with optional extra context."""
        self._log("CRITICAL", message, extra)
