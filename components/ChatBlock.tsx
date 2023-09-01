//Heavily borrowed from a16z


export function ChatBlock({text, mimeType, url,id} : {
    text?: string,
    mimeType?: string,
    url?: string
    id?:string
}) {
    let internalComponent = <></>
    if (text && text.length > 1) {
        internalComponent = <span>{text}</span>
    } else if (mimeType) {
        if (mimeType.startsWith("audio")) {
            internalComponent = <audio controls={true} src={url} />
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
        <p className="text-sm text-gray-200 pb-2">
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
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  
export function responseToChatBlocks(completion: any) {
    // First we try to parse completion as JSON in case we're dealing with an object.
    console.log("got completoin", completion, typeof completion)
    if (typeof completion == "string") {
        try {
            completion = JSON.parse(completion)
        } catch {
            // Do nothing; we'll just treat it as a string.
            console.log("Couldn't parse")
        }
    }
    let blocks = []
    if (typeof completion == "string") {
        console.log("still string")
        blocks.push(<ChatBlock key={uuidv4()} text={completion} />)
    } else if (Array.isArray(completion)) {
        console.log("Is array")
        for (let block of completion) {            
            blocks.push(<ChatBlock key={uuidv4()} {...block} />)
        }
    } else {
        blocks.push(<ChatBlock key={uuidv4()} {...completion} />)
    }
    console.log(blocks)
    return blocks
}