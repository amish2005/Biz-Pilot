import os
os.environ['GEMINI_API_KEY'] = 'AIzaSyDQskE8NHxXF-wWuLX96FZR1VQoeOrIKkE'
from crewai import LLM, Agent, Task, Crew, Process
llm = LLM(model='gemini/gemini-2.5-flash')
agent = Agent(role='Tester', goal='saying hello', backstory='none', llm=llm)
task = Task(description='Say hello', expected_output='a greeting', agent=agent)
crew = Crew(agents=[agent], tasks=[task], process=Process.sequential)
print(crew.kickoff())
