<h1 align="center"> ts-skarbsend </h1>
<p align="center">
  <b>Send notifications by skarbsend</b>
</p>

## Documentations

https://webigorkiev.github.io/ts-skarbsend/

## Installation

```bash
yarn add ts-skarbsend
```

## Usage

### Send notification

```typescript
import {skarbsend} from "ts-skarbsend";

const provider = skarbsend({
    token: "Basic auth password",
    from: "Aplpha name" // less 11 symbol latin or number
})

const {id}  = await provider.send({
    to: "<phone>",
    message: "sms text"
});
```

### Fetch status notification

```typescript
const {status} = await provider.status({
    id:"sms id"
});

```