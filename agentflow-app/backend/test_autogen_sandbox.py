import os
import autogen
llm_config = {'config_list': [{'model': 'gemini-2.5-flash', 'api_key': 'AIzaSyDQskE8NHxXF-wWuLX96FZR1VQoeOrIKkE', 'api_type': 'google'}]}
assistant = autogen.AssistantAgent(name='bot', llm_config=llm_config, system_message='You are a helpful assistant. Keep it short.')
user = autogen.UserProxyAgent(name='user', human_input_mode='NEVER', max_consecutive_auto_reply=0, code_execution_config=False)
chat_res = user.initiate_chat(assistant, message='Hello, how are you?', clear_history=False)
print(chat_res.summary)
