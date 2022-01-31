# network-state-example-app-react
Example app which authenticates and interacts with an API that is only accessible with a wallet holding a certain token.

![Auth Flow](img/auth-flow.png)

This repository contains the *User Wallet* and *React App* of the sequence diagram. Have a look at [suud/network-state-backend-aws](https://github.com/suud/network-state-backend-aws) for an implementation of the other parts.

Learn more about the motivation behind this repository by reading [this article](https://blog.suud.org/aws-cognito-nft-auth).

## Prerequisites
- AWS Cognito
- AWS API Gateway
- AWS Lambda Function

You can get started by deploying this [Example AWS CDK Stack](https://github.com/suud/network-state-backend-aws).

## Usage
```
# clone repository
git clone git@github.com:suud/network-state-example-app-react.git
cd network-state-example-app-react

# install dependencies
npm install

# configure app
cp src/config.js.example src/config.js
vim src/config.js

# configure aws amplify
cp src/aws-exports.js.example src/aws-exports.js
vim src/aws-exports.js

# run development build
npm start

# create production build
npm run build
```
