# UniTrade Executor Service

Allows "executors" to process limit orders on UniSwap.

## Setup

### Prequisites

- Node.JS v12.11.1 or greater
- Yarn is preferred as a package manager

### Installation

First, pull the repository and install dependencies:

```code
$ git clone https://github.com/UniTradeApp/unitrade-service.git
$ cd unitrade-service
$ yarn
```

### Create Config

Next, create an environment configuration file:

- Duplicate the `.env.example` file in the repository root
- Rename it to `.env`
- Add your values for each environment variable

See the "Environment Variables" section below for more information on each variable.

## Basic Usage

Use the `main` script to build and run the service.

```code
$ yarn main
```

## Advanced Usage

### Rebuilding

If, after modifying the code, you don't see your changes after running `yarn main` (or `yarn build` by itself), re-build the service from scratch:

```code
$ yarn build:fresh
```

### Development

Uses Nodemon to automatically restart the service after code changes.

```code
$ yarn dev
```

## Environment Variables

#### `ACCOUNT_PRIVATE_KEY`
Fees collected for processing orders will be deposited to this account.

#### `PROVIDER_URI`
Points to an Ethereum network or node.

#### `UNITRADE_ADDRESS`
The address of the UniTrade smart contract on your chosen network.

#### `UNISWAP_ROUTER_ADDRESS`
The address of the UniSwap Router02 smart contract.

#### `UNISWAP_FACTORY_ADDRESS`
The address of the UniSwap Factory smart contract.

#### `DEFAULT_GAS_LIMIT`
Default gas limit to use for transactions.
