/* eslint-disable @typescript-eslint/ban-types */
import aws, { DynamoDB } from "aws-sdk";
import { TransactWriteItemsOutput } from 'aws-sdk/clients/dynamodb';
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import "dotenv/config";
import { AttrMap } from "./TableObject";
import TransactGetItemsOutput = DocumentClient.TransactGetItemsOutput;

export const getDynamoDB = ():DynamoDB => {
    if (process.env.AWS_SAM_LOCAL) {
        return new DynamoDB({region: "localhost" , endpoint: "http://dynamo-local:8000"})

    } else if (process.env.LOCAL_TEST){
        return new DynamoDB({region: "localhost", endpoint: "http://localhost:8000", 
        accessKeyId: process.env.aws_access_key_id,
        secretAccessKey: process.env.aws_secret_access_key})

    } else {
        return new DynamoDB({region: "ap-northeast-2" })
    }
}

export const getDocumentClient = ():DocumentClient => {
    return new aws.DynamoDB.DocumentClient({ service: getDynamoDB()});
};

export const makePutItemInput = (target:AttrMap):DocumentClient.PutItemInput => {
    const putItem = {};
    const keys = Object.keys(target);
    keys.forEach( key => {
        const value = target[key];
        putItem[key] = value;
    });

    const putItemInput:DocumentClient.PutItemInput = {
        TableName: "",
        Item :putItem,
        ReturnValues: "NONE"
    }
    return putItemInput;
}

export default class SimpleDynamodbClient {

    private docClient  = getDocumentClient();
    private tableName  = "";
    
    constructor(tableName:string) {
        this.tableName = tableName;
    }

    getDocClient():DocumentClient {
        return this.docClient;
    }

    public async query<T>(type: (new () => T), queryInput:DocumentClient.QueryInput):Promise<Array<T>> {

        queryInput["TableName"] = this.tableName;

        return new Promise((resolve, reject) => {
            this.docClient.query(queryInput, function(err, data) {
				if (err) {
					reject(err);
				} 
				else {
                    const queryItems: Array<T> = [];
                    data.Items?.forEach(item => {
                        const queryItem = Object.assign(new type(), item);
                        queryItems.push(queryItem);
                    });
					resolve(queryItems);
				}
			});			
		});
    }
    
    async update<T>(type: (new () => T), updateItemInput:DocumentClient.UpdateItemInput):Promise<T>{

        updateItemInput["TableName"] = this.tableName;
        
        return new Promise((resolve, reject) => {
			this.docClient.update(updateItemInput, function(err, data) {
				if (err) {
                    reject(err);
				} 
				else {
                    const output:T = Object.assign(new type(), data.Attributes);
					resolve(output);
				}
			});			
		});
    }

    public async batchWrite<T>(type: (new () => T), batchWriteItemInput: DocumentClient.BatchWriteItemInput):Promise<number>{        
        return new Promise((resolve, reject) => {
			this.docClient.batchWrite(batchWriteItemInput, function(err, data) {
				if (err) {
					reject(err);
				} 
				else {
                    resolve(Number(data));
				}
			});			
        });
    }

    public async batchGet<T>(type: (new () => T), getItemInput: DocumentClient.BatchGetItemInput):Promise<Array<T>>{
        getItemInput["TableName"] = this.tableName;
        
        return new Promise((resolve, reject) => {
			this.docClient.batchGet(getItemInput, function(err, data) {
				if (err) {
					reject(err);
				} 
				else {
                    const queryItems: Array<T> = [];
                    console.log(data);
                    resolve(queryItems);
				}
			});			
        });
    }

    public async get<T>(type: (new () => T), getItemInput: DocumentClient.GetItemInput):Promise<T>{
        getItemInput["TableName"] = this.tableName;
        
        return new Promise((resolve, reject) => {
			this.docClient.get(getItemInput, function(err, data) {
				if (! data.Item ) {
					reject("cannot get a item by key");
				} 
				else {
                    const output:T = Object.assign(new type(), data.Item);
					resolve(output);
				}
			});			
        });
    }

    public async put<T>(type: (new () => T), putItemInput: DocumentClient.PutItemInput):Promise<T>{
        
        putItemInput["TableName"] = this.tableName;
        
        return new Promise((resolve, reject) => {
			this.docClient.put(putItemInput, function(err, data) {
				if (err) {
					reject(err);
				} 
				else {
                    const output:T = Object.assign(new type(), putItemInput.Item);
					resolve(output);
				}
			});			
        });
    }

    public async transactGet(transactGetItemInput:DocumentClient.TransactGetItemsInput):Promise<TransactGetItemsOutput> {
        return new Promise((resolve, reject) => {
            this.docClient.transactGet(transactGetItemInput, function(err, data) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }

    public async commit(transactWriteItemsInput:DocumentClient.TransactWriteItemsInput):Promise<TransactWriteItemsOutput> {
        
        return new Promise((resolve, reject) => {
			this.docClient.transactWrite(transactWriteItemsInput, function(err, data) {
				if (err) {
					reject(err);
				} 
				else {
					resolve(data);
				}
			});			
		});
    }
}
