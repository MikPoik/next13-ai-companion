// Heavily borrowed from a16z

import React from "react";

export function ChatBlock({ text, mimeType, url, id }: {
    text?: string,
    mimeType?: string,
    url?: string
    id?: string
}) {
    let internalComponent = <></>
    if (text && text.length > 1) {
        // Check if the text contains markdown italics and apply corresponding style
        const parts = text.split(/(\*.*?\*)/).map((part, index) => 
            part.startsWith('*') && part.endsWith('*') ? <i key={index} style={{ color: "rgba(255,255,255,0.6)" }}>{part.slice(1, -1)}</i> : part
        );
        internalComponent = <span style={{lineHeight:"1.5rem"}}>{parts}</span>;
    } else if (mimeType) {
        if (mimeType.startsWith("audio")) {
            let audioSrc = ``;
            if (!url){
                audioSrc = `https://api.steamship.com/api/v1/block/${id}/raw`;
            }
            else {
                audioSrc = url;
            }
            internalComponent = <audio controls={true} src={audioSrc} />
        } else if (mimeType.startsWith("video")) {
            internalComponent = <video controls width="250">
                <source src={url} type={mimeType} />
                Download the <a href={url}>video</a>
            </video>
        } else if (mimeType.startsWith("image")) {
            let imgSrc = `https://api.steamship.com/api/v1/block/${id}/raw`;
            internalComponent = <img src={imgSrc} />
        }
    } else if (url) {
        internalComponent = <a href={url}>Link</a>
    }

    return (
        <p className="text-sm pb-2">
            {internalComponent}
        </p>
    );
}

/*
 * Take a completion, which may be a string, JSON encoded as a string, or JSON object,
 * and produce a list of ChatBlock objects. This is intended to be a one-size-fits-all
 * method for funneling different LLM output into structure that supports different media
 * types and can easily grow to support more metadata (such as speaker).
 */
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function responseToChatBlocks(completion: any) {
    // First we try to parse completion as JSON in case we're dealing with an object.
    //console.log("got completoin", completion, typeof completion)
    if (typeof completion == "string") {
        try {
            completion = JSON.parse(completion)
        } catch {
            // Do nothing; we'll just treat it as a string.
            //console.log("Couldn't parse")
        }
    }
    let blocks = []
    if (typeof completion == "string") {
        //console.log("still string")
        blocks.push(<ChatBlock key={uuidv4()} text={completion} />)
    } else if (Array.isArray(completion)) {
        //console.log("Is array")
        for (let block of completion) {
            blocks.push(<ChatBlock key={uuidv4()} {...block} />)
        }
    } else {
        blocks.push(<ChatBlock key={uuidv4()} {...completion} />)
    }
    //console.log(blocks)
    return blocks
}