# conf_give_FE

## Environment

Configure the giving frontend through Vite environment variables. For GA4 in a
production deployment, supply the Measurement ID through the deployment
environment (do not hardcode it in source):

```dotenv
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

GA4 is enabled only in a Vite production build when `VITE_APP_ENV=production`
and a Measurement ID is present. It is otherwise disabled safely, including
during `vite dev`.
