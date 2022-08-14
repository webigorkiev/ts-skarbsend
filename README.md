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

## Notification

### Send notification

```typescript
import {skarbsend} from "ts-skarbsend";

const provider = skarbsend({
    token: "<token>",
    from: "Aplpha name" // less 11 symbol latin or number
})

const {id}  = await provider.send({
    phone: "<phone>",
    text: "sms text"
});
```

### Fetch status notification

```typescript
const {status} = await provider.status({
    id:"sms id"
});

```

## Send batch notification

### Send batch

```typescript
import {skarbsend} from "ts-skarbsend";

const provider = skarbsend({
    token: "<token>",
    from: "Aplpha name" // less 11 symbol latin or number
})

const {id}  = await provider.sendBatch({
    rows: [{
        phone: string,
        text: string
    }]
});
```

### Fetch status notification

```typescript
const {status} = await provider.statusBatch({
    id:"batch id"
});

```