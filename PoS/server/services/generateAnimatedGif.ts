import gm from 'gm';
import fs from 'fs';
import path from 'path';
import { logger } from "../loggerConfiguration.js";

export default async function generateAnimatedGif(collection:any, filename:string, tokens:any, cacheFolder:string) {
    const width = 350;
    const height = 350;

    var end_image = gm(width, width, '#000000');

    await new Promise<void>((resolve, reject) => {
        collection.tokenIds.forEach(async (id:string, i: number) => {
            let t:any = tokens.find((token:any) => token.tokenIdStr == id.replace(/^0+/,''));
            if (t != null) {
                end_image.in(path.join(cacheFolder, t.image.replace('ipfs://', '')));
                end_image.delay(100);
            }
        });
        end_image.write(path.join(cacheFolder,filename), function(err){
            if (err) {
                logger.error("server.generate.animatedGif.created %s", err);
                reject();
            }
            else {
                logger.info("server.generate.animatedGif.created");
                resolve();
            }
        });
    });
}
