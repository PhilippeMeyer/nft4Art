/* global BigInt */

import * as cst from './constants.js'

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

    export function encodeVote(items) {
        let ret = BigInt(0);
        let pos = 0;
        items.forEach((item, i) => {
            let value;

            if (item.type == cst.dateLbl) {
                let date = new Date(item.value.$y, item.value.$M, item.value.$D) / 1000;
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

    //
    // decodeVote
    // decode the 128 bit field in which the vote is stored
    //
    // Parameters:
    //  - the encoded vote sent as a BigInt
    //  - the items being displayed as part of the questionnaire
    // Returns:
    //  - the items being updated (field value)
    //
    // This function writes directly into the items array which is a react state component
    //

    export function decodeVote(receivedValue, items) {
        let pos = 0;
        let mask = 0;

        items.forEach((item) => {
            let nb = parseInt(item.nb);
            let value = receivedValue >> BigInt(pos);

            switch(item.type) {
                case cst.chooseLbl:
                case cst.checkboxLbl:
                case cst.optionLbl:
                    pos += nb;
                    mask = (1<<nb)-1;
                    break;
                case cst.sliderLbl:
                    pos += 32 - Math.clz32(nb);
                    mask = (1<<(32 - Math.clz32(item.nb))) -1;
                    break;
                case cst.dateLbl:
                    pos += 16 //we store the number of days since 01/01/1970 and with 16 bits we can cover 179 years (2149)
                    mask = (1<<16)-1;
                    break;
                case cst.rankingLbl:
                    pos += 3;
                    mask = (1<<3)-1;
            }

            if (item.type == cst.dateLbl) item.value = Number(value & BigInt(mask)) * 3600 * 24;
            else item.value = Number(value & BigInt(mask));
        })
    }
