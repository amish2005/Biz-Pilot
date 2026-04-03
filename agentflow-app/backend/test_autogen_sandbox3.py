import os
from autogen import AssistantAgent, UserProxyAgent

os.environ['GEMINI_API_KEY'] = 'AIzaSyDQskE8NHxXF-wWuLX96FZR1VQoeOrIKkE'
llm_config = {
    'config_list': [
        {'model': 'gemini-2.5-flash', 'api_key': os.getenv('GEMINI_API_KEY'), 'api_type': 'google'}
    ]
}

assistant = AssistantAgent(name='bot', llm_config=llm_config, system_message='You are a helpful assistant. Keep it short.')
user = UserProxyAgent(name='user', human_input_mode='NEVER', max_consecutive_auto_reply=0, code_execution_config=False)

chat_res = user.initiate_chat(assistant, message='Hello, how are you?')
print("OUTPUT:", chat_res.summary)
