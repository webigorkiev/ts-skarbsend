import fetch from "cross-fetch";

export namespace skarbsend {
    export type statuses = "added" | "enroute" | "accepted" | "delivered" | "undeliverable" | "expired" | "rejected" | "unknown" | "error";
    export type channels = "push"|"sms"|"viber";
    export interface Options {
        token: string,
        from?: string,
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
    export interface SendRequest {
        sandbox?:boolean,
        merchant?: string,
        from?: string,
        phone: string,

        channels?: channels[],

        text: string,
        title?:string,
        detaild?:string,

        callback?: string,
        email?: boolean, // Дополнительно отправить на email если он есть

        push?: Push,
        viber?: Viber,
        sms?: Sms
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
    export interface Provider {
        merchants(): Promise<ResponseMerchants>;
        send(params:SendRequest): Promise<ResponseSend>;
        status(id: string, year?: number|Date): Promise<ResponseStatus>;
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

    public async send(params:skarbsend.SendRequest): Promise<skarbsend.ResponseSend> {
        const {body} = await this.fetch(
            `${this.opts.entry}/send`,
            "post",
            {
                from: this.opts.from,
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