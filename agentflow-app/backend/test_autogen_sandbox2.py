import asyncio
import os
os.environ['GEMINI_API_KEY'] = 'AIzaSyDQskE8NHxXF-wWuLX96FZR1VQoeOrIKkE'
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient

async def main():
    model_client = OpenAIChatCompletionClient(
        model='gemini-2.5-flash',
    )
    agent = AssistantAgent('bot', model_client, system_message='Say hello')
    response = await agent.on_messages([{'role': 'user', 'content': 'Hello'}], cancellation_token=None)
    print(response.chat_message.content)

asyncio.run(main())
