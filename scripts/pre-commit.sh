#!/bin/bash
git diff --cached --name-only | if grep --quiet "lambdas"
then
  npx lerna run lint --stream
  exit 0
fi

git diff --cached --name-only | if grep --quiet "step-function.asl.json"
then
  echo "TODO: lint step function"
  exit 0
fi