// In-App Purchase bridge (RevenueCat). Only exists inside the iPhone app: the website never loads this file.
import {Purchases} from '@revenuecat/purchases-capacitor';
var ready=false;
window.SA_IAP={
  // sign in to RevenueCat with the Scan user id (the server uses the same id to read the subscription)
  init:function(uid){
    var key=window.SA_RC_KEY;
    if(!key||/PASTE/.test(key))return Promise.reject({code:"not_configured"});
    var p=ready?Promise.resolve():Purchases.configure({apiKey:key,appUserID:uid}).then(function(){ready=true});
    return p.then(function(){return Purchases.logIn({appUserID:uid})});
  },
  packages:function(){return Purchases.getOfferings().then(function(o){return(o&&o.current&&o.current.availablePackages)||[]})},
  buy:function(pkg){return Purchases.purchasePackage({aPackage:pkg})},
  restore:function(){return Purchases.restorePurchases()}
};
