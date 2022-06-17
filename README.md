# Vonage Video Breakout Room Demo App

Breakout rooms are additional rooms where you can split from main session for participants to work in separate, smaller groups.

The Breakout Room app has following roles:
  - Single Moderator -- moderator has full control of breakout room features and privilege to add/remove participants’ co-hosts permissions.
  - Multiple Co-Host -- Co-Host has full control of breakout room features
  - Multiple Participant -- participant can join a breakout room and return to the main room


Moderator/Co-host:
  - Create, Edit, Remove breakout rooms sessions
  - Allow participants to choose a room
  - Join and Leave a breakout room
  - Move participants to across rooms
  - Send message to specific room
  - Broadcast message to all rooms
  - Set Countdown timer to end the breakout rooms.
  - Moderator's privilege: Promote participant to Co-Host

Participants:
  - Join a breakout room
  - Return to main session
  - Request moderator's help from breakout room

When you first launch the app, you will be asked to enter a main session room name. Ensure both moderator and participant have the same room name so they can join the same main session.


## Environment Variables
You need to setup some environment variables 

  - `PORT` -- this variable works only for manual deployment. Heroku deployment will automatically fill the value.
  - `API_KEY` -- your Vonage Video API - API Key
  - `API_SECRET` -- your Vonage Video API - API Secret
  - `DATABASE_URL` -- this variable works only for manual deployment. Heroku deployment will automatically fill the value.
  - `REACT_APP_MODERATOR_PIN` -- pin number for moderator to join in
  - `REACT_APP_PARTICIPANT_PIN` -- pin number for participant to join in
  - `REACT_APP_API_URL` -- this variable works only for development if you want to run backend and frontend on different server. Set the value to your backend api url.
  - `SESSION_MONITORING_PATH` -- your session monitoring path.

## Architecture
This Breakout Room application contains `backend` and `frontend`. However, the `backend` needs a database to store session information. You need to install `postgres` for the database. Any other than `postgres` will not work.

  - Backend -- we use `express`
  - Frontend -- we use `ReactJS`
  - Database -- we use `postgres`

## Register Session Monitoring Callbacks
Set up session monitoring url in your opentok account after deployment.
  - Go to your Opentok project
  - Set the callback URL in the Session Monitoring section with url: {Your-app-public-url}/{SESSION_MONITORING_PATH} Example: https://breakout-rooms.herokuapp.com/session-monitoring

## Deploy to Heroku
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/nexmo-se/video-breakout-room)

## Manual Deployment
This section is for manual deployment. It means you need to have a 
  
  - Linux machine with `SSH`. Make sure you can `SSH` to your machine.
  - `NodeJS` installed
  - `yarn` or `npm` installed
  - `postgres` installed 

Once you satisfy the requirements, you can proceed to below steps.
  
  - Clone and navigate inside this repository.
  - Rename `.env.example` to `.env` and fill in the environment variable.
  - Install dependencies by typing `yarn install` if you are using `yarn` or `npm install` if you are using `npm`
  - Build the package by typing `yarn build` if you are using `yarn` or `npm run build` if you are using `npm`
  - Start the server `yarn start:express:prod` or `npm run start:express:prod`
  - Open your web browser. For example `http://localhost:3002`

The local deployment has been done. You can use various technology such as `ngrok` or `nginx` to make it public. Furthermore, for this demo to run smoothly in public, you need `https` or `SSL`. 

`ngrok` will automatically grant you `SSL` certificate. However, if `nginx` was choose as public deployment, you can use `Let's Encrypt` to get your free `SSL` certificate.
