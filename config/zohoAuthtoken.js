import { request } from "express";
const options={
    url:'https://inventory.zoho.com/api/v1/items',
    method: 'GET',
    headers:{
        'Content-Type': 'application/json',
        'Authorization': 'Zoho-oauthtoken 1000.8148d3720c33e89fcf4455a9df8738c3.f2da894efcb0ea1d7c656f0e2c46fd41'
    },
}
const params = {
    'organization_id':60012963145
}

request({options, qs:params},  (error, response) => {
    console.log(error,response.body);
    return;
});