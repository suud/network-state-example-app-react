# network-state-example-app-react
Example app which authenticates and interacts with an API that is only accessible with a wallet holding a certain token.

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
