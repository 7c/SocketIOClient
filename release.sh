#!/bin/bash
reset=`tput sgr0`
out() {
  echo "$(tput setab 2)$1 ${reset}";
}
if [[ -z "$1" ]];
then
    echo "Please describe your commit, ./release 'your description'"
    exit
fi
git status
git status | grep -q 'Untracked files' && {
    echo "!!! >>>> Untracked files detected"
    echo "!!! >>>> Aborted"
    exit  
}
chmod +x *.sh
test -e package.json && {
  npm --no-git-tag-version version patch
  sleep 1
}
git commit -am "$1"
git push -u origin master
# export lastCommit=$(git rev-parse HEAD)
# out "Last commit hash = $lastCommit"