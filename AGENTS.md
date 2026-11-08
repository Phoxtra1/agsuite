# Architecture rules

- Keep temporary public access controlled by `PUBLIC_AUTH_PAUSED`; retain admin protection and use an isolated local-only Workspace scope so visitors never inherit private account data.