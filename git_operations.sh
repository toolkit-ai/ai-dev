#!/bin/bash

# Variables from arguments
github_token=$1
github_username=$2
github_user_email=$3
github_repo_owner=$4
github_repo_name=$5
github_branch=$6
temp_dir=$7

# Set git config
git config --global user.name "${github_username}"
git config --global user.email "${github_user_email}"

# Construct GitHub URL and clone the repository
github_url="https://${github_token}@github.com/${github_repo_owner}/${github_repo_name}.git"
git clone ${github_url} ${temp_dir}
cd ${temp_dir}
git checkout ${github_branch} || git checkout -b ${github_branch}