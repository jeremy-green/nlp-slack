#!/bin/bash
git diff --cached --name-only | if grep --quiet "lambdas"
then
  npx lerna run lint --stream
fi

git diff --cached --name-only | if grep --quiet "step-function.asl.json"
then
  echo "TODO: lint step function"
fi