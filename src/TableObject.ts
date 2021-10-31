import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";

export type attrType   = string | boolean | number | Array<string>;
export type AttrMap    = Map <string, attrType>;
export type ArrayOfMap = Array< AttrMap >;

export default abstract class TableObject {
	private PK: string
	private SK: string

	constructor(PK: string, SK: string){
		this.PK = PK;
		this.SK = SK;
	}

	// Put 을 저장하기 위한 Item
	public getPutItem():DocumentClient.PutItemInput {
		const putItem = {};
		const keys = Object.keys(this);
		keys.forEach( key => {
			const value = this[key];
			if( ! (value instanceof Array) && ! (value instanceof Map) && ! (value instanceof TableObject) ){
				putItem[key]  = value;
			}
		});

		const putItemInput = {
			TableName: "",
			Item: putItem,
			ReturnValues: "NONE"		
		}
		return putItemInput;
	}
	
	// batchWrite 에 사용하기 위한 PutRequest 생성
	public getPutRequest():DocumentClient.PutRequest {

		const item = {};
		const keys = Object.keys(this);
		keys.forEach( key => {
			const value = this[key];

			// value 가 Array 인 경우 다른 SortKey 이므로 제외, string[] 인 경우 child class 에 직접 추가 한다.
			if( ! (value instanceof Array) ){
				item[key]  = value;
			}
		});

		const putRequest = {
			Item: item
		}
		return putRequest;
	}

	// Map 으로 변환해서 반환
	public getMap():AttrMap  {

		const attrMap = new Map();
		const keys = Object.keys(this);
		keys.forEach( key => {
			const value = this[key];
			if( value !== undefined ) {
				attrMap[key] = value;
			}
		});
		return attrMap;
	}

	// Map 으로 설정
	public setMap(attrMap:AttrMap):void  {

		const keys = Object.keys(this);
		
		keys.forEach( key => {
			const value = attrMap[key];
			if( value !== undefined ) {
				this[key] = value;
			}
		});
	}

	// Getter 
	public getPK():string { return this.PK }
	public getSK():string { return this.SK }

	// 객체를 초기화 하는 메소드를 만드시 작성하도록 함.
	public abstract init():void;
}

export const getCurrentDate = ():string => {
	const date = new Date();
		const mm = date.getMonth() + 1;
		const dd = date.getDate();
		const hh = date.getHours();
		const mi = date.getMinutes();
		const ss = date.getSeconds();

		return [
			date.getFullYear(),
			(mm > 9 ? "" : "0") + mm,
			(dd > 9 ? "" : "0") + dd,
			(hh > 9 ? "" : "0") + hh,
			(mi > 9 ? "" : "0") + mi,
			(ss > 9 ? "" : "0") + ss,
		].join("");
}

export const isJson = (str: string):boolean => {
    try {
        JSON.parse(str);
	} catch {
		throw str;
    }
    return true;
}

export class Sequence extends TableObject {
	private currentValue: number

	constructor(currentValue?:number){
		super("GLOBAL", "SEQUENCE");

		if(currentValue !== undefined ){
			this.currentValue = currentValue;
		}
	}

	public init():void { this.currentValue = 0;}

	public getCurrentValue(): number { return this.currentValue }
}
