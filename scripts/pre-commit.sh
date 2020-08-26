#!/bin/bash
git diff --cached --name-only | if grep --quiet "lambdas"
then
  # https://www.paperstreetonline.com/2013/06/12/bash-split-a-variable-into-an-array-with-carriage-return-line-feed-as-the-delimiter/
  lambdas=$( git diff --cached --name-only | grep "lambdas" )
  IFS=$'\n'
  lambdas_array=($( echo $lambdas | sed ':a;N;$!ba;s/\r\n/ /g' ))

  OUT=()
  for i in "${lambdas_array[@]}"
  do
    echo "$i\n"
    path_to_package="$(dirname "${i}")/package.json"
    echo "$path_to_package\n"
    name=$(jq --raw-output ".name" $path_to_package)
    echo "$name\n"
    OUT+=("$name")
  done

  echo $OUT
  scope=$(IFS=,; echo "${OUT[*]}")

  # some_var=$(git diff --cached --name-only | grep "lambdas")
  # echo $some_var
  # path_to_package="$(dirname "${some_var}")/package.json"
  # echo $(jq --raw-output ".name" $path_to_package)

  npx lerna run publish --stream --scope="$scope"
  exit 0
fi

git diff --cached --name-only | if grep --quiet "step-function.asl.json"
then
  echo "TODO: update step function"
  exit 0
fi