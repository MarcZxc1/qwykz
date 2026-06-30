import os
import redis.asyncio as aioredis

def get_redis():
    url = os.getenv("REDIS_URL", "redis://localhost:6379")
    return aioredis.from_url(url, decode_responses=True)

redis_client = get_redis()
