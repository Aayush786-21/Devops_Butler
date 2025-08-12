"""
AI Rate Limiter Module
Handles rate limiting for AI API calls with exponential backoff
"""

import asyncio
import time
import random
from typing import Optional, Callable, Any
import logging

logger = logging.getLogger(__name__)

class AIRateLimiter:
    """Rate limiter for AI API calls with exponential backoff"""
    
    def __init__(
        self,
        max_retries: int = 5,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        backoff_factor: float = 2.0,
        jitter: bool = True
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.backoff_factor = backoff_factor
        self.jitter = jitter
    
    async def execute_with_retry(
        self,
        func: Callable[..., Any],
        *args,
        **kwargs
    ) -> Optional[Any]:
        """
        Execute a function with exponential backoff retry logic
        
        Args:
            func: The function to execute
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function
            
        Returns:
            The result of the function call or None if all retries failed
        """
        last_exception = None
        
        for attempt in range(self.max_retries + 1):
            try:
                # Execute the function
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = await asyncio.to_thread(func, *args, **kwargs)
                
                return result
                
            except Exception as e:
                last_exception = e
                
                # If this was the last attempt, re-raise the exception
                if attempt == self.max_retries:
                    logger.error(f"All {self.max_retries + 1} attempts failed. Last error: {e}")
                    return None
                
                # Calculate delay for next attempt
                delay = min(
                    self.base_delay * (self.backoff_factor ** attempt),
                    self.max_delay
                )
                
                # Add jitter if enabled
                if self.jitter:
                    delay = delay * (0.5 + random.random() * 0.5)
                
                logger.warning(
                    f"Attempt {attempt + 1} failed with {type(e).__name__}: {e}. "
                    f"Retrying in {delay:.2f} seconds..."
                )
                
                await asyncio.sleep(delay)
        
        return None

# Global rate limiter instance
rate_limiter = AIRateLimiter()
