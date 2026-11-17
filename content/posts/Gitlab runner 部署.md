---
title: gitlab runner 部署
date: '2023-05-03 16:29:44'
category: 学习
tags:
  - Gitlab
draft: false
---

# Gitlab runner 部署
```
// runner 安装
docker run -d --name gitlab-runner --restart always -v /srv/gitlab-runner/config:/etc/gitlab-runner -v /var/run/docker.sock:/var/run/docker.sock gitlab/gitlab-runner:latest

// runner 注册
docker run --rm -it -v /srv/gitlab-runner/config:/etc/gitlab-runner gitlab/gitlab-runner register

Enter the GitLab instance URL (for example, https://gitlab.com/):
https://gitlab.com/
Enter the registration token:
XXX
Enter a description for the runner:
[9af187779a47]:
Enter tags for the runner (comma-separated):

Enter optional maintenance note for the runner:

Enter an executor: custom, docker-ssh, shell, virtualbox, docker+machine, docker-ssh+machine, kubernetes, docker, parallels, ssh, instance:
docker
Enter the default Docker image (for example, ruby:2.7):
alphine
```