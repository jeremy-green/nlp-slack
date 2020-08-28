#!/bin/bash
git diff-tree -r --name-only --no-commit-id master | if grep --quiet "lambdas"
then
  npx lerna run publish --stream
fi

git diff-tree -r --name-only --no-commit-id master | if grep --quiet "step-function.asl.json"
then
  echo "TODO: update step function"
fi