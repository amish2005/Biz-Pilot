import os
from crewai import LLM, Agent, Task, Crew, Process
# Pass api key explicitly
llm = LLM(model='gemini/gemini-2.5-flash', api_key='AIzaSyDQskE8NHxXF-wWuLX96FZR1VQoeOrIKkE')
agent = Agent(role='Tester', goal='saying hello', backstory='none', llm=llm)
task = Task(description='Say hello', expected_output='a greeting', agent=agent)
crew = Crew(agents=[agent], tasks=[task], process=Process.sequential)
print(crew.kickoff())
