# UniTrade Executor Service

Allows "executors" to process limit orders on UniSwap.

## DISCLAIMER

This software is provided as an open source starting point for you to develop your own solution. While UniTrade believes that this example will work as intended on a basic level, it is not optimized, so if you run it as-is, you will likely experience losses. Evaluate the code yourself, identify and implement your optimization strategies, and manage the risks involved before running this application. If you are not comfortable modifying the code yourself, UniTrade discourages you from using this software.

## Setup

### Prequisites

- Node.JS v12.11.1 or greater
- Yarn is preferred as a package manager
- Docker (optional)

### Installation

Pull the repository and install dependencies:

```
$ git clone https://github.com/UniTradeApp/unitrade-service.git
$ cd unitrade-service
$ yarn
```

### Create Config

Creating an environment configuration file is a required step for both local and Docker usage.

- Duplicate the `.env.example` file in the repository root
- Rename it to `.env`
- Add your values for each environment variable

_See the comments in your new `.env` file for more information on each variable._

## Basic Usage

### Local Instance

Use the `start` script to build and run the service.

```
$ yarn start
```

### Docker

- Make sure Docker is installed
- Create and fill out a `.env` file as described by the "Create Config" section above.

To run the container, use:

```
$ docker run --env-file=.env unitrade/executor-service:latest
```

- If you're running the above command from outside the repository root, substitute the correct path for `.env`.
- To run a specific container version, replace `latest` with the version number.

_Images for the Executor service can be found on [DockerHub](https://hub.docker.com/repository/docker/unitrade/executor-service)._

## Advanced Usage

### Rebuilding

If, after modifying the code, you don't see your changes after running `yarn start` (or `yarn build` by itself), re-build the service from scratch:

```
$ yarn build:fresh
```

### Development

Uses Nodemon to automatically restart the service after code changes.

```
$ yarn dev
```
