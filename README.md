# Magnet Agent

Magent Agent is a tool-enabled coding assistant that can spin up a docker sandbox for an AI agent to clone a Github repo in, pull or create a branch, and then use a set of tools to try to accomplish a task you've specified.

To configure the docker coding agent, you'll need to set the following in a .env file:

```
#.env
OPENAI_API_KEY= {{YOUR_OPENAI_API_KEY}}
```

Start the agent by calling:
```
./start-agent-docker.sh
```

The Docker agent exposes an API that you can call by executing:
```
POST http://127.0.0.1:8080/task

// Parameters:
{
  "taskDescription": "I'm working on a implementing a feature 'add a clear conversation in widget', What might be the files that I should open to start my work on this feature",
  "githubToken": "{{YOUR GITHUB TOKEN}}
  "githubRepoOwner": "hey-pal",
  "githubRepoName": "pal-web",
  "githubBranch": "main",
  "userName": "nicolaerusan",
  "userEmail": "nicolaerusan@gmail.com"
}