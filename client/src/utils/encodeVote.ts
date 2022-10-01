/* global BigInt */

import * as cst from './constants'

    //
    // encodeVote
    // Encode the vote as a 128 bits field
    //
    // Parameter:
    //  - items: an array of questions
    // Returns:
    //  - the encoded answer in a 128 bits word
    //
    // The encode function takes each answer to the different questions and encode this using a bit per question
    // for dates, the number of days after 01.01.1970 is stored on 16 bits
    // rankings having 5 stars are stored on 3 bits
    // for sliders, the number of bits depends on the scale. We use the length of the scale to determine the number of bits needed

    export default function encodeVote(items:any):bigint {

        let ret:bigint = BigInt(0);
        let pos:number = 0;
        
        items.forEach((item:any, i:number) => {
            let value:bigint;
            let date:number;

            if (item.type == cst.dateLbl) {

                if (item.value.$y !== undefined)  date = new Date(item.value.$y, item.value.$M, item.value.$D).getTime() / 1000;
                else  date = new Date(item.value).getTime() / 1000;
                value = BigInt(Math.floor(date /(3600*24))) << BigInt(pos);
            } else {
                value = BigInt(item.value) << BigInt(pos);
            }
            ret = ret | value;

            let nb = parseInt(item.nb);

            switch(item.type) {
                case cst.chooseLbl:
                case cst.checkboxLbl:
                case cst.optionLbl:
                    pos += nb;
                    break;

                case cst.sliderLbl:
                   pos += 32 - Math.clz32(nb);        //We look at the number of bits needed to store the n
                   break;
                case cst.dateLbl:
                    pos += 16;                      //we store the number of days since 01/01/1970 and with 16 bits we can cover 179 years (2149)
                    break;
                case cst.rankingLbl:
                    pos += 3;
            }
        });

        return ret;
    }

