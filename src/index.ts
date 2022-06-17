import fetch from "cross-fetch";

export namespace skarbsend {
    export type statuses = "added" | "enroute" | "accepted" | "delivered" | "read" | "undeliverable" | "expired" | "rejected" | "unknown" | "error";
    export type channels = "push"|"sms"|"viber";
    export interface Options {
        token: string,
        merchant?: string,
        from?: string,
        fromViber?:string,
        entry?:string
    }
    interface NotificationBase {
        text?: string,
        [key: string]: any
    }
    export interface Push extends NotificationBase {
        title?:string,
        icon?: string|"up"|"down"|"point"|"key"|"info"|"question"|"discount"|"danger"|"close"|"allmart"|"tehnoskarb"|"goldmart"|"skarb"|"app",
        type?: "actions"|"actions-accent"|"links"|"links-accent",
        response?:string, // Ответ после использования экшинов
        actions: {
            action: string,
            title: string,
            icon: string|"up"|"down"|"point"|"key"|"info"|"question"|"discount"|"danger"|"close"
        }[]
    }
    export interface Viber extends NotificationBase  {
        title?:string
    }
    export interface Sms extends NotificationBase  {
        from?: string // Альфа имя
    }
    export interface RequestSend {
        sandbox?:boolean,
        merchant?: string,
        from?: string,
        fromViber?:string,
        phone: string,

        channels?: channels[],

        text: string,
        title?:string,
        detailed?:string,

        delay?: number, // Задержка отправки max 3600 сек

        callback?: string,
        // email?: boolean, // Дополнительно отправить на email если он есть

        push?: Push,
        viber?: Viber,
        sms?: Sms
    }
    export interface RequestSendBatch {
        sandbox?:boolean,
        merchant?: string,
        from?: string,
        fromViber?:string,
        // email?:boolean, // Get urlEncoded - stage 2
        start?: string,
        delay?: number, // Задержка до 2 дней
        channels?: channels[],
        callback?: string,
        rows: {
            phone: string,
            text: string,
            title?: string,
            detailed?: string,

            push?: Push,
            viber?: Viber,
            sms?: Sms
        }[]
    }
    export interface ResponseSend {
        id: string,
    }
    export type ResponseMerchants = {
        id: string,
        label: string,
        senders: string[],
        channels: string[],
        balance: number
    }[]

    /**
     * «added» - Добавлено в систему,
     * «enroute» - принято/ожидает отправки,
     * «accepted» - отправлено в сеть
     * «delivered» - доставлено,
     * «read» - прочитано,
     * «undeliverable» - доставка невозможна,
     * «expired» - истек срок доставки,
     * «rejected» - отклонено сетью
     * «unknown» - Сбой сети при доставке SMS
     * «error» - Ошибка отправки
     */
    export interface ResponseStatus  {
        status: statuses,
        channel: channels
    }
    export interface ResponseSendBatch {
        id: string, // uuid of batch // Get
        rows: {
            id: string,
            phone: string
        }[] // tsv: phone    id
    }
    export interface ResponseStatusBatch {
        rows: ResponseStatus[]
    }
    export interface Provider {
        merchants(): Promise<ResponseMerchants>;
        send(params:RequestSend): Promise<ResponseSend>;
        sendBatch(params:RequestSendBatch): Promise<ResponseSendBatch>;
        status(id: string, year?: number|Date): Promise<ResponseStatus>;
        statusBatch(id: string, year?: number|Date): Promise<ResponseStatusBatch>;
    }
}
export class SkarbsendError extends Error {
    public code?: number;
    constructor(message?:string, code?:number) {
        super();
        this.message = message|| "";
        this.code = code;
    }
}
class Skarbsend {
    private defaultOpts: Omit<skarbsend.Options, "token"> = {
        entry: "https://auth.skarb.group/api/v1/notifications-service"
    }
    private opts: Required<skarbsend.Options>;

    constructor(options: skarbsend.Options) {
        this.opts = Object.assign({}, this.defaultOpts, options) as Required<skarbsend.Options>;
    }

    public async merchants() {
        const {body} = await this.fetch(`${this.opts.entry}/merchants`, "get");
        return body.data?.rows || [];
    }

    public async send(params:skarbsend.RequestSend): Promise<skarbsend.ResponseSend> {
        const {body} = await this.fetch(
            `${this.opts.entry}/send`,
            "post",
            {
                merchant: this.opts.merchant,
                from: this.opts.from,
                fromViber: this.opts.fromViber,
                ...params
            }
        );
        return body.data || {};
    }

    public async sendBatch(params:skarbsend.RequestSendBatch): Promise<skarbsend.ResponseSendBatch> {
        const {body} = await this.fetch(
            `${this.opts.entry}/send-batch`,
            "post",
            {
                merchant: this.opts.merchant,
                from: this.opts.from,
                fromViber: this.opts.fromViber,
                ...params
            }
        );
        return body.data || {};
    }

    public async status(id: string, year?: number|Date): Promise<skarbsend.ResponseStatus> {
        year = year instanceof Date ? year.getFullYear() : year;
        const {body} = await this.fetch(
            `${this.opts.entry}/status`,
            "post",
            {
                id,
                year
            }
        );
        return body.data || {};
    }

    public async statusBatch(id: string, year?: number|Date): Promise<skarbsend.ResponseStatusBatch> {
        year = year instanceof Date ? year.getFullYear() : year;
        const {body} = await this.fetch(
            `${this.opts.entry}/status-batch`,
            "post",
            {
                id,
                year
            }
        );
        return body.data || {};
    }

    private async fetch(url: string, method: string, params: Record<string, any> = {}) {
        method = method.toLowerCase();
        const urlObj = new URL(url);
        method === "get" && Object.keys(params).length && (urlObj.search = new URLSearchParams(params).toString());

        const response = await fetch(urlObj.toString(), {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this.opts.token
            },
            ...(method === "get" ? {} : {body: JSON.stringify(params)}),
            method
        });
        const body = await response.json();
        if(!response.ok) {
            throw new SkarbsendError(
                "Api skarbsend: " + (body.error || response.statusText) + ", code: " + response.status,
                response.status
            );
        }
        if(body.isError) {
            throw new SkarbsendError(body.error, response.status);
        }
        return {response, body};
    }
}
export const skarbsend = (opts: skarbsend.Options) => new Skarbsend(opts);