# dollar-price-to-google-sheets

App that gets the ARS/USD exchange rate from Ambito and writes it to a Google Spreadsheet. 

Also used this project as an opportunity to use Bun as this was made with Bun v1.0.23. I came across some interesting stuff like the fact that Axios does not fucking work with Bun yet.

## Environment variables

| Variable              | Comment                                                                   |
|-----------------------|---------------------------------------------------------------------------|
| SERVICE_ACCOUNT_EMAIL | The email of the service account used to connect to the spreadsheet       |
| SERVICE_ACCOUNT_KEY   | The private key of the service account used to connect to the spreadsheet |
| SHEET_ID              | The Google Sheets spreadsheet ID                                          |

## To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```
