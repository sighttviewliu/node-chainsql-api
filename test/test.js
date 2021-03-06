'use strict'
const co = require('co')
const ChainsqlAPI = require('../src/index').ChainsqlAPI;
// ChainsqlAPI.prototype.callback2Promise = require('./callback2Promise');
const c = new ChainsqlAPI();

const RippleAPI = new require('chainsql-lib').RippleAPI;

var user = {
	secret: "xxWFBu6veVgMnAqNf6YFRV2UENRd3",
	address: "z9VF7yQPLcKgUoHwMbzmQBjvPsyMy19ubs",
	publicKey: "cBRmXRujuiBPuK46AGpMM5EcJuDtxpxJ8J2mCmgkZnPC1u8wqkUn"
}

var owner = {
	secret: "xnoPBzXtMeMyMHUVTgbuqAfg1SUTb",
	address: "zHb9CJAWyB4zj91VRWn96DkukG4bwdtyTh"	
}

// var owner = {
// 	"address":"r93pPN539JdTNqFsmeSJBYafd7ZzzpVCC"
// }


var sTableName = "aac";
var sTableName2 = "boy1234";
var sReName = "boy1234";
var sTableName3 = "hijack12";

main();

async function main(){
	try {
		await c.connect('ws://192.168.0.110:6007');
		//await c.connect('ws://192.168.0.16:6006');

		console.log('连接成功')

		c.as(owner);

		c.setRestrict(true);
		//激活user账户
		// await activateAccount(user.address);

		//await testSubscribe();

		//await testRippleAPI();
		// await testAccount();
		await testChainsql();

		//await c.disconnect();
		console.log('运行结束')
	}catch(e){
		console.error(e);
	}
}

var testSubscribe = async function(){
	subTable(sTableName,owner.address);
	setTimeout(function(){
		unsubTable(sTableName,owner.address);
	},5000);
	await subTx();
}

function testUnSubscribe(){	
	unsubTable(sTableName,owner.address);	
}

async function subTx() {
	//获取账户信息
	let info = await c.api.getAccountInfo("rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh");
	console.log(info);
	//获取当前区块号
	c.getLedgerVersion(function(err,data){
		var payment = {
			"Account": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
			"Amount":"1000000000",
			"Destination": "rBuLBiHmssAMHWQMnEN7nXQXaVj7vhAv6Q",
			"TransactionType": "Payment",
			"Sequence": info.sequence,
			"LastLedgerSequence":data + 5,
			"Fee":"50"
		}
		let signedRet = c.sign(payment,owner.secret);
		c.api.submit(signedRet.signedTransaction).then(function(data){
            console.log(data);
        });
		//订阅
		testSubscribeTx(signedRet.id);
		setTimeout(function(){
			testUnSubscribeTx(signedRet.id);
		},5000);
	});
}
function testSubscribeTx(hash){
	var event = c.event;
	event.subscribeTx(hash,function(err, data) {
		if(err)
			console.log(err);
		else
			console.log("subtx return:", data)
	}).then(function(data) {
		console.log('subTx success.');
	}).catch(function(error) {
		console.log('subTx error:' + error);
	});
}

function testUnSubscribeTx(hash){	
	var event = c.event;
	event.unsubscribeTx(hash).then(function(data) {
		console.log('unsubTx success.');
	}).catch(function(error) {
		console.log('unsubTx error:' + error);
	});	
}

async function testRippleAPI(){
	// await testGetLedgerVersion();
	// await testGetLedger();

	// await testGetTransactions();
	// await testGetTransaction();
	// await testGetServerInfo();
	await testUnlList();
}

async function testAccount(){
	var account = await generateAccount();
	console.log("new account:",account);
	await activateAccount(account.address);
}

async function testChainsql(){
	// await testCreateTable();

	// // //创建另一张表，用来测试rename,drop
	// await testCreateTable1();
	// await testInsert();
	// await testUpdate();m
	// await testDelete();
	// await testRename();
	// await testGet();
	// await testDrop();
	await testGrant();
	// await testTxs();
	// await insertAfterGrant();
	// await testOperationRule();	

	//现在底层不允许直接删除所有记录这种操作了
	// await testDeleteAll();

}

function subTable(tb, owner) {
	var event = c.event;
	event.subscribeTable(owner,tb,function(err, data) {
		if(err)
			console.log(err);
		else
			console.log(data)
	}).then(function(data) {
		console.log('subTable success.');
	}).catch(function(error) {
		console.log('subTable error:' + error);
	});
}

function unsubTable(tb, owner) {
	var event = c.event;
	event.unsubscribeTable(owner, tb).then(function(data) {
		console.log('unsubTable success.');
	}).catch(function(error) {
		console.log('unsubTable error:' + error);
	});
}

//创建一个加密的表,table为要创建的表,confidential为是否要加密
var testCreateTable = async function() {
	var raw = [
		{'field':'id','type':'int','length':11,'PK':1,'NN':1,'UQ':1,'AI':1},
		{'field':'name','type':'varchar','length':50,'default':null},
		{'field':'age','type':'int'}
	]
	var option = {
		confidential: false
	}
	// 创建表
	let rs = await c.createTable(sTableName, raw, option).submit({expect:'db_success'});
	console.log("testCreateTable" , rs)
};

var testCreateTable1 = async function() {
	var raw = [
		{'field':'id','type':'int','length':11,'PK':1,'NN':1,'UQ':1,'AI':1,'default':''},
		{'field':'name','type':'varchar','length':50,'default':null},
		{'field':'age','type':'int'}
	]
	var option = {
		confidential: false
	}
	// 创建表
	let rs = await c.createTable(sTableName2, raw, option).submit({expect:'db_success'});
	console.log("testCreateTable1" , rs)
};

//重复插入的情况下报异常
var testInsert = async function() {
	var raw = [
		{'age': 333,'name':'hello'},
		{'age': 444,'name':'sss'},
		{'age': 555,'name':'rrr'}
	]
	var rs = await c.table(sTableName).insert(raw).submit({expect:'db_success'});
	console.log("testInsert",rs);
}

var testUpdate = async function(){
	var rs = await c.table(sTableName).get({'id': 2}).update({'age':200}).submit({expect:'db_success'});
	console.log("testUpdate",rs);
}

var testDelete = async function(){
	var rs = await c.table(sTableName).get({'id': 3}).delete().submit({expect:'db_success'});
	console.log("testDelete" ,rs)
}

var testRename= async function(){
	var rs = await c.renameTable(sTableName2,sReName).submit({expect:'db_success'});
	console.log("testRename",rs);
}
var testGet = async function(){

	var raw = []
	//求和
	// var rs = await c.table(sTableName).get(raw).withFields(["SUM(id)"]).submit();
	// var rs = await c.table(sTableName).get(raw).withFields([]).submit();

	// var raw = {id:1}
	var rs = await c.table(sTableName).get({name:'sss'}).order({id:-1}).limit({index:0,total:1}).withFields([]).submit();
	// var rs = await c.table(sTableName).get().withFields(["COUNT(*)"]).submit();
	console.log("testGet",rs.lines);
}
var testDrop = async function(){
	var rs = await c.dropTable(sReName).submit({expect:'db_success'});
	console.log("testDrop",rs);
}

//重复授权可能出异常，测一下
var testGrant = async function(){
	var raw = {insert:false,update:false,delete:true};
	var rs = await c.grant(sTableName, user.address, raw, user.publicKey).submit({expect:'db_success'})
	console.log("testGrant",rs);
}
var insertAfterGrant = async function(){
	c.as(user);
	c.use(owner.address);
	var raw = [
		{'age': 333,'name':'hello'},
		{'age': 444,'name':'sss'},
		{'age': 555,'name':'rrr'}
	]
	var rs = await c.table(sTableName).insert(raw).submit({expect:'db_success'});
	console.log("insertAfterGrant",rs);
	// 切换回原来的账户
	c.as(owner);
}

var testTxs = async function(){
	c.beginTran();
	var raw = [
		{'field':'id','type':'int','length':11,'PK':1,'NN':1,'UQ':1,'AI':1},
		{'field':'name','type':'varchar','length':50,'default':null},
		{'field':'age','type':'int'},
		{'field':'account','type':'varchar','length':64}
	]

	var option = {
		confidential: true
	}
	c.createTable(sTableName,raw,option);
	c.grant(sTableName,user.address,{insert:true,update:true},user.publicKey)
	c.table(sTableName).insert({'age': 333,'name':'hello'});
	c.table(sTableName).get({'age':333}).update({'name':'world'});
	var rs = await c.commit({expect: 'db_success'});
	console.log("testTxs",rs);
}

var testOperationRule = async function(){
	var raw = [
		{'field':'id','type':'int','length':11,'PK':1,'NN':1,'UQ':1,'AI':1},
		{'field':'name','type':'varchar','length':50,'default':null},
		{'field':'age','type':'int'},
		{'field':'account','type':'varchar','length':64}
	]
	var rule = {
		'Insert':{
			'Condition':{'account':'$account'},
			'Count':{'AccountField':'account','CountLimit':5},
		},
		'Update':{
			'Condition':{'$or':[{'age':{'$le':28}},{'id':2}]},
			'Fields':['age']
		},
		'Delete':{
			'Condition':{'$and':[{'age':'$lt18'},{'account':'$account'}]}
		},
		'Get':{
			'Condition':{'id':{'$ge':3}}
		}
	};
	var option = {
		confidential: false,
		operationRule: 	rule
	}
	// 创建表
	let rs = await c.createTable(sTableName3, raw, option).submit({expect:'db_success'});
	console.log("testOperationRule",rs)
	// let rs = await c.table(sTableName3).get().order({id:-1}).submit();
	// console.log(rs);
}

var generateAccount = async function(){
	return c.generateAddress();
}
var activateAccount = async function(account){
	let rs = await c.pay(account,200);
	console.log(rs);
}

async function testGetLedgerVersion(){
	c.getLedgerVersion(callback);
	// var index = await c.callback2Promise(c.getLedgerVersion);
	// console.log(index);
}
async function testGetLedger(){
	var opt = {
		ledgerVersion :666,	// || 'validated',
		includeAllData : false,
		includeTransactions : true,
		includeState : false
	}
	c.getLedger(opt,callback);
	// var rs = await callback2Promise(c.getLedger,opt);
	// console.log(rs);
}

async function testGetTransactions(){
	// var opt = {
	// 	minLedgerVersion : 	1,// || -1,
	// 	// -1 is equivalent to most recent available validated ledger
	// 	limit:20,
	// 	maxLedgerVersion : 500
	// }
	var opt = {limit:12}
	c.getTransactions(owner.address,opt,callback);
	// var rs = await callback2Promise(c.getTransactions,opt);
	// console.log(rs);
}
async function testGetTransaction(){
	// let rs = await c.getTransaction('3E02AA296A348F10C1F54D2EF0CBBDA9A6D389F66EFFBA936F1842506FACD4EA');
	// console.log(rs);

	c.getTransaction('3E02AA296A348F10C1F54D2EF0CBBDA9A6D389F66EFFBA936F1842506FACD4EA',callback);
	// var rs = await callback2Promise(c.api.getTransaction,opt);
	// console.log(rs);
}
async function testGetServerInfo(){
	// let rs = await c.getServerInfo();
	// console.log(rs);
	c.getServerInfo(callback);
	// var rs = await callback2Promise(c.api.getServerInfo);
	// console.log(rs);
}

async function testUnlList(){
	// c.getUnlList(callback);
	let rs = await c.getUnlList();
	console.log(rs);
}

function callback(err,data){
	if(err){
		console.error(err);
	}else{
		console.log(JSON.stringify(data));
	}
}