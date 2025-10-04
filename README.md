# AI-Powered Amount Detection Backend

## Overview

This backend service extracts financial amounts from medical bills or receipts using OCR, normalization, and context classification. It processes images or text inputs and returns structured JSON with labeled amounts, currency, and provenance.

The project is modularized with separate folders for routes, services, middleware, validators, and utilities to ensure clean code and maintainability.

---

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm 

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-folder>
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the `backend` folder with the following content:

```
PORT=8000
```

4. Start the server:

```bash
npm start
```

The server will run on `http://localhost:8000`.

---

## Project Structure

```
backend/
├── src/
│   ├── routes/               # API route handlers
│   ├── services/             # Business logic and processing services
│   ├── middleware/           # Middleware (e.g., multer for file uploads)
│   ├── validators/           # Schema validation using Zod
│   └── utils/                # Utility functions (e.g., logger)
├── package.json
├── README.md
└── index.js                  # Main server entry point
```

---

## API Endpoints

### 1. OCR Extraction

**POST** `/api/ocr`

- Accepts an image file (`receipt`) via multipart/form-data.
- Returns extracted text and OCR confidence.

**Postman Request:**

- Method: POST
- URL: `http://localhost:8000/api/ocr`
- Body: form-data
  - Key: `receipt` (type: File)
  - Value: Select your receipt image file

---

### 2. Amount Extraction and Normalization

**POST** `/api/extract`

- Accepts JSON body with OCR text.
- Returns extracted amounts, normalized amounts, and detected currency.

**Postman Request:**

- Method: POST
- URL: `http://localhost:8000/api/extract`
- Body: raw, JSON
```json
{
  "text": "Total: INR 1200 | Paid: 1000 | Due: 200"
}
```

---

### 3. Classification by Context

**POST** `/api/classify`

- Accepts JSON body with OCR text and extracted amounts.
- Returns classified amounts with confidence scores.

**Postman Request:**

- Method: POST
- URL: `http://localhost:8000/api/classify`
- Body: raw, JSON
```json
{
  "text": "Total: INR 1200 | Paid: 1000 | Due: 200",
  "extractedAmounts": [
    {"type":"total_bill","value":1200,"source":"Total: INR 1200"},
    {"type":"paid","value":1000,"source":"Paid: 1000"},
    {"type":"due","value":200,"source":"Due: 200"}
  ]
}
```

---

### 4. Full Extraction Pipeline

**POST** `/api/full-extract`

- Accepts an image file (`receipt`) or OCR text.
- Runs the full pipeline and returns final structured JSON.

**Postman Request (Image):**

- Method: POST
- URL: `http://localhost:8000/api/full-extract`
- Body: form-data
  - Key: `receipt` (type: File)
  - Value: Select your receipt image file

**Postman Request (Text):**

- Method: POST
- URL: `http://localhost:8000/api/full-extract`
- Body: raw, JSON
```json
{
  "text": "Total: INR 1200 | Paid: 1000 | Due: 200"
}
```

---

## Testing

- Use the above Postman requests to test each endpoint.
- Verify the outputs at each step to ensure correctness.
- Report any issues or unexpected behavior.

---

## Contact

For questions or support, please contact the development team.
