/* global BigInt */

import * as cst from './constants.js'


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
