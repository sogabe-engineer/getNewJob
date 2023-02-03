/* ****************************************************
*  初期設定
*******************************************************/
const fs = require('fs');
const { promisify } = require('util');
const webdriver = require('selenium-webdriver');
const { Builder, By, until } = webdriver;

const capabilities = webdriver.Capabilities.chrome();
capabilities.set('chromeOptions', {
  args: [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    `--window-size=1980,1200`
  ]
});

//ブラウザ立ち上げ
const driver = new Builder().withCapabilities(capabilities).build();

/*****************************************************
*  使用するプロパティー
*******************************************************/
//アクセスするURL
const CONNECT_URL = "https://kyushoku.hellowork.mhlw.go.jp/kyushoku/GEAA040010.do?action=initDisp&screenId=GEAA040010";
//現在時刻の取得
let currentTime = dateTime();
//過去の求人データの読み込み
let oldWorkNames = jsonFileToArray("data/currentWorkName.txt");
//IDとパスワード・パスの読み込み
const PROFILE = require('./loginEnv.js');
const { send } = require('process');

/******************************************************
*                       関数
*******************************************************/
/* ----------------------------
  waittime(int millsecond)
  指定したミリ秒動作をSTOPする。
-------------------------------*/
function waitTime(millisecond) {
  return new Promise(resolve => setTimeout(resolve, millisecond));
}

/* --------------------
  現在時刻を取得する。
-----------------------*/
function dateTime() {
  require('date-utils');
  const DATE = new Date();
  let currentTime = DATE.toFormat('MMDDHH24MI');
  return currentTime;
}

/* ---------------------------
  jsonファイルを配列に変換する。
------------------------------*/
function jsonFileToArray(fileName) {
  let getData = fs.readFileSync(fileName, 'UTF-8');
  return JSON.parse(getData);
}
/*=====================================================
*  ブラウザ操作関数
*=====================================================*/
/* ---------------------
  IDを指定して入力する。
------------------------*/
async function inputById(idName, inputData) {
  //Element取得
  let Element = await driver.findElement(By.id(idName));
  //テキスト入力
  await Element.sendKeys(inputData);
}
/* ---------------------
  IDを指定してクリックする。
------------------------*/
async function clickById(idName) {
  let Element = await driver.findElement(By.id(idName));
  await Element.click();
}

/*=====================================================
*   求人情報画面
    求人情報取得に関する関数
*=====================================================*/
//職種を取得する
async function getCurrentWorkNames() {
  //求人情報の取得
  let getCurrentWorkNameElement = await driver.findElements(By.xpath("//tr[@class='kyujin_head']/td/div/div/table/tbody/tr/td[@class='m13 fs1']/div"));
  //取得した職種を配列にする。 後述の判定式で使用する。
  let currentWorkNames = await new Array();
  for (let i = 0; i < getCurrentWorkNameElement.length; i++) {
    currentWorkNames[i] = await getCurrentWorkNameElement[i].getText();
  }
  //比較するため取得した職種の配列を逆順にする。
  await Array.prototype.reverse.call(currentWorkNames);
  return currentWorkNames;
}


//求人の詳細を取得する
async function getWorkDetailDatas() {
  let workDetailDatas = new Object('company', 'location', 'detail', 'money', 'worktime', 'holiday', 'getlink');
  //会社名
  const companySelector = "//tr[@class='kyujin_body']/td/div/div[@class='left-side']/table/tbody/tr[2]/td[2]/div";
  let companyElements = await driver.findElements(By.xpath(companySelector));
  let tmpCompany = await new Array();
  for (let i = 0; i < companyElements.length; i++) {
    tmpCompany[i] = await companyElements[i].getText();
  }
  workDetailDatas['company'] = tmpCompany;
  await Array.prototype.reverse.call(workDetailDatas['company']);

  //勤務地
  const locationSelector = "//tr[@class='kyujin_body']/td/div/div[@class='left-side']/table/tbody/tr[3]/td[2]/div";
  let locationElements = await driver.findElements(By.xpath(locationSelector));
  let tmpLocation = await new Array();
  for (let i = 0; i < locationElements.length; i++) {
    tmpLocation[i] = await locationElements[i].getText();
  }
  workDetailDatas['location'] = tmpLocation;
  await Array.prototype.reverse.call(workDetailDatas['location']);

  //勤務内容
  const detailSelector = "//tr[@class='kyujin_body']/td/div/div[@class='left-side']/table/tbody/tr[4]/td[2]/div";
  let detailElements = await driver.findElements(By.xpath(detailSelector));
  let tmpDetail = await new Array();
  for (let i = 0; i < detailElements.length; i++) {
    tmpDetail[i] = await detailElements[i].getText();
  }
  workDetailDatas['detail'] = tmpDetail;
  await Array.prototype.reverse.call(workDetailDatas['detail']);

  //給与
  const moneySelector = "//tr[@class='kyujin_body']/td/div/div[@class='left-side']/table/tbody/tr[6]/td[2]/div";
  let moneyElements = await driver.findElements(By.xpath(moneySelector));
  let tmpMoney = await new Array();
  for (let i = 0; i < moneyElements.length; i++) {
    tmpMoney[i] = await (await moneyElements[i].getText()).replace(",", "，");
  }
  workDetailDatas['money'] = tmpMoney;
  await Array.prototype.reverse.call(workDetailDatas['money']);

  //勤務時間
  const worktimeSelector = "//tr[@class='kyujin_body']/td/div/div[@class='right-side']/table/tbody/tr[1]/td[2]";
  let worktimeElements = await driver.findElements(By.xpath(worktimeSelector));
  let tmpWorktime = await new Array();
  for (let i = 0; i < worktimeElements.length; i++) {
    tmpWorktime[i] = await worktimeElements[i].getText();
  }
  workDetailDatas['worktime'] = tmpWorktime;
  await Array.prototype.reverse.call(workDetailDatas['worktime']);

  //休日
  const holidaySelector = "//tr[@class='kyujin_body']/td/div/div[@class='right-side']/table/tbody/tr[2]/td[2]";
  let holidayElements = await driver.findElements(By.xpath(holidaySelector));
  let tmpHoliday = await new Array();
  for (let i = 0; i < holidayElements.length; i++) {
    tmpHoliday[i] = await holidayElements[i].getText();
  }
  workDetailDatas['holiday'] = tmpHoliday;
  await Array.prototype.reverse.call(workDetailDatas['holiday']);

  //リンク
  const linkSelector = "//tr[@class='kyujin_foot']/td/div/a";
  let linkElements = await driver.findElements(By.xpath(linkSelector));
  let tmpLink = await new Array();
  for (let i = 0; i < linkElements.length; i++) {
    tmpLink[i] = await linkElements[i].getAttribute('href');
  }
  workDetailDatas['link'] = tmpLink;
  await Array.prototype.reverse.call(workDetailDatas['link']);

  return workDetailDatas;
}

//求人情報を更新する。
async function joblistUpdate(currentWorkNames, oldWorkNames, workDetailDatas) {
  let isUpdate = false;
  let tmpWorkDetail = await new Array();

  //現在の求人の数
  for (let i = 0; i < currentWorkNames.length; i++) {

    //旧データと新データがマッチしないときデータを保持する。
    if (oldWorkNames[i] != currentWorkNames[i]) {
      //更新フラグをONにする。

      if (isUpdate == false) {
        isUpdate = await true;
      }

      //データの保持
      tmpWorkDetail.push(
        {
          "職種": await currentWorkNames[i],
          "企業名": await workDetailDatas['company'][i],
          "就業場所": await workDetailDatas['location'][i],
          "詳細": await workDetailDatas['detail'][i],
          "賃金": await workDetailDatas['money'][i],
          "就業時間": await workDetailDatas['worktime'][i],
          "休日": await workDetailDatas['holiday'][i],
          "リンク": await workDetailDatas['link'][i]
        }
      )
    }
  }
  //let writeWorkDetail = await JSON.stringify(tmpWorkDetail);
  return [tmpWorkDetail, isUpdate];
}
/* ---------------------
  メール送信 nodemailer使用
------------------------*/
async function sendMailWork(writeWorkDetail) {

  let sendMailData = writeWorkDetail.split(",");
  //IDパスワードを取得
  const MAILENV = require('./mailEnv.js');

  //Nodemailer
  const nodemailer = require('nodemailer')

  //認証情報 Nodemailerオブジェクトを生成
  const porter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
      // Gmailアカウント
      user: MAILENV.id,
      // アプリパスワード
      pass: MAILENV.password
    }
  })
  let sendText = "";
  for (let i = 0; i < sendMailData.length; i++) {
    sendText += sendMailData[i] + "\n";
  }

  porter.sendMail({
    from: MAILENV.fromMailAddress,
    //送信先のアドレス
    to: MAILENV.sendMailAddress,
    // 件名
    subject: 'ハローワーク求人新着',
    // メール本文
    text: sendText
  }, function (err, info) {
    if (err) {
      console.log('送信できませんでした');
      console.error(err);
      return
    }
    // 送信確認
    console.log('送信完了', info);
  })
}

/* ****************************************************
*  ブラウザ操作
*******************************************************/
(async () => {
  //アクセス
  await driver.get(CONNECT_URL);

  /******************
      ログイン画面
  *******************/
  //ID入力
  await inputById("ID_loginMailTxt", PROFILE.login_id);
  //パスワード入力
  await inputById("ID_loginPasswordTxt", PROFILE.password);
  //ログイン
  await clickById("ID_loginBtn");
  //待機時間
  await waitTime(3000);

  /******************
      検索画面
  *******************/
  //検索ボタンクリック 一番初めのボタンのみ
  await clickById("ID_searchBtn");
  //待機時間
  await waitTime(3000);

  /******************
      求人情報画面
  *******************/
  /* --------------------------------
  旧データと新データの比較を行い
  新しい求人情報があればデータを保持する。
  ----------------------------------*/
  //職種を取得する。
  let currentWorkNames = await new Array();
  currentWorkNames = await getCurrentWorkNames();

  //求人情報の詳細を取得する
  let workDetailDatas = await new Array();
  workDetailDatas = await getWorkDetailDatas();

  //求人情報を取得する。
  let result = await joblistUpdate(currentWorkNames, oldWorkNames, workDetailDatas);
  let tmpWriteWorkDetail = await result[0];
  let writeWorkDetail = JSON.stringify(tmpWriteWorkDetail);
  //更新の有無
  let isUpdate = await result[1];

  /*****************************
  新しい求人情報があれば保存+メール送信する。
  ******************************/
  if (isUpdate == true) {
    //メールの送信
    await sendMailWork(writeWorkDetail);

    //求人情報の書き込み
    await fs.writeFile(`${PROFILE.path}${currentTime}result.txt`, writeWorkDetail, (error) => {
      if (error) throw error;
      console.log("新しい求人が見つかりました。");
    });
    //比較用のデータに書き込む
    let writeCurrentWorkName = JSON.stringify(currentWorkNames);
    await fs.writeFile(`${PROFILE.path}currentWorkName.txt`, writeCurrentWorkName, (error) => {
      if (error) throw error;
    });
  } else {
    //結果を書き込む
    await fs.writeFile(`${PROFILE.path}${currentTime} result.txt`, "新しい求人なし", (error) => {
      if (error) throw error;
      console.log("新しい求人なし");
    });
  }

  //終了
  driver.quit();
}
)();
