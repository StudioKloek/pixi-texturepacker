"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const ora=require("ora"),fs=require("fs-extra"),get=require("get-value"),defaults=require("object.defaults");async function readSettingsFrom(e){const t=ora(`Reading settings from ${e}...`).start();let a={};try{const r=await fs.readJSON(e);a=get(r,"sprites",{}),a=defaults(a,{sourceDirectory:"./assets/",scriptDirectory:"./assets/converted/",targetDirectory:"./assets/converted/",watch:!1,watchDelay:500,extrude:!1,includeSizeInfo:!1,directories:[]})}catch(r){return t.fail(`Could not load settings from ${e}... (does it exist?)`),a}const r=a.directories.length;return r?t.succeed(`Found ${r} directories to process...`):t.fail("Found no directories to process..."),a}function makeVariableSafe(e){return e.replace(/(\W)/g,"_").replace(/_{2,}/g,".").replace(/^_/,"").replace(/_$/,"")}function kebabCase(e){return e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").replace(/([A-Z])([A-Z])(?=[a-z])/g,"$1-$2").toLowerCase()}const defaults$1=require("object.defaults"),util=require("util"),execProcess=util.promisify(require("child_process").exec),baseOptions={format:"pixijs4","texture-format":"png","png-opt-level":0,opt:"RGBA8888","prepend-folder-name":!0,"trim-sprite-names":!0,algorithm:"MaxRects","maxrects-heuristics":"Best","pack-mode":"Best","scale-mode":"Smooth",multipack:!0,"force-identical-layout":!0,"trim-mode":"Trim","alpha-handling":"ClearTransparentPixels","default-pivot-point":"0,0","enable-rotation":!0,quiet:!0,extrude:"0","shape-padding":"2",variant:["1:@2x","0.5:"]};async function packFolder(e,t){const a=buildTexturePackerCommand(e,defaults$1(t,baseOptions));try{await execProcess(a)}catch(e){if(e&&e.stderr)throw new Error(e.stderr);return!1}return!0}function buildTexturePackerCommand(e,t){t=t||{};const a=new TexturePackerCommand;return a.addPath(`${e}`),Object.keys(t).forEach(e=>{a.addOption(e,t[e])}),a.build()}class TexturePackerCommand{constructor(){this.commands=[],this.path=""}addPath(e){this.path=e}addOption(e,t){this.commands.push({option:`--${kebabCase(e)}`,value:t})}build(){if(!this.path)throw new Error("Must specify a path to process (image/directory)");const e=this.commands.map(e=>this.resolveValue(e.option,e.value)).join(" ");return`TexturePacker ${this.path} ${e}`}resolveValue(e,t){return Array.isArray(t)?t.map(t=>this.resolveValue(e,t)).join(" "):`${e}${t=!0===t?"":` ${t}`}`}}const get$1=require("get-value"),set=require("set-value"),globby=require("globby"),pupa=require("pupa"),uppercamelcase=require("uppercamelcase"),camelcase=require("camelcase"),fs$1=require("fs-extra"),path=require("path"),loaderInfoTemplate="export default {\n  fileName : '{fileName}',\n  numberOfParts : {numberOfParts},\n  type: 'sprites'\n};",assetTemplate="export const {assetName} = {assetData};";async function getDataFrom(e){return await fs$1.readJson(e)}function convertPathToVariableName(e,t){let a=(e=`${e}`).replace(`${t}/`,"").split("/").map(makeVariableSafe),r=a.pop();r=r.toUpperCase(),a=a.map(camelcase);let o=t.split("/");return(o=o.slice(o.length-(1===o.length?1:2))).push("sprites"),o=uppercamelcase(o.join("-")),a.length>0?[o,e=(e=a.join(".")).replace(/(\W^\.)/g,"").replace(/\.{2,}/g,".").replace(/^\./,"").replace(/\.$/,""),r].join("."):[o,r].join(".")}function getNumberOfParts(e){if(e.length>0){const t=e[0];return get$1(t,"meta.related_multi_packs",{default:[]}).length+1}return 0}function parseAssetData(e,t,a){const r=t,o={};for(const t of e||[])for(const e of Object.keys(t.frames)){let s;if(a){const a=t.frames[e];s={id:e,width:a.sourceSize.w,height:a.sourceSize.h}}else s=e;set(o,convertPathToVariableName(e,r),s)}return o}function getSortedItems(e){const t=[];for(const a of Object.keys(e))e.hasOwnProperty(a)&&t.push([a,e[a]]);t.sort((e,t)=>{const a=e[0],r=t[0];return a<r?-1:a>r?1:0});const a={};for(const e of t)a[e[0]]=e[1];return a}function generateContents(e,t){let a="";for(const t of Object.keys(e)){const r=getSortedItems(e[t]);let o=JSON.stringify(r,null,2);o=o.replace(/"([^(")"]+)":/g,"$1:"),a=`${a}${pupa(assetTemplate,{assetName:t,assetData:o})}\n`}return a=`${a}${pupa(loaderInfoTemplate,{fileName:t.fileName,numberOfParts:t.numberOfParts})}\n`}function getScriptPath(e,t){const a=e.split("/"),r=a.pop();return a.length<2&&a.push(r),e=a.join("/"),`${path.join(t,e)}/assets/sprites-${r}.ts`}async function generateCode(e,t,a){const r=get$1(a,"scriptDirectory",t.scriptDirectory),o=get$1(a,"includeSizeInfo",t.includeSizeInfo),s=await globby(`${path.join(t.targetDirectory,e)}/*[1-9]+.json`),n=[];for(const e of s)n.push(getDataFrom(e));const i=await Promise.all(n),c=generateContents(parseAssetData(i,e,o),{fileName:e,numberOfParts:getNumberOfParts(i)}),l=getScriptPath(e,r);await fs$1.outputFile(l,c)}const ora$1=require("ora"),logSymbols=require("log-symbols"),chalk=require("chalk"),path$1=require("path"),get$2=require("get-value"),isPacking={},shouldPackAgain={};async function packAll(e,t){console.log(logSymbols.info,chalk.blue("Start packing all items..."));for(const a of e)await pack(a,t);console.log(logSymbols.success,chalk.green("Done packing all items..."))}async function pack(e,t){let a,r;Array.isArray(e)?(a=e[0],r=e[1]):a=e;const o=a.split("/").pop();if(isPacking[a])return console.log(logSymbols.warning,chalk.yellow("Allready packing, starting again afterwards...")),void(shouldPackAgain[a]=!0);isPacking[a]=!0;const s={sheet:`${path$1.join(t.targetDirectory,a,o)}-{n1}{v}.png`,data:`${path$1.join(t.targetDirectory,a,o)}-{n1}{v}.json`,replace:`${o}=${a}`,extrude:get$2(r,"extrude",t.extrude)?"1":"0"},n=ora$1(`Packing ${a}`).start();try{if(!await packFolder(`${path$1.join(t.sourceDirectory,a)}`,s))return void n.fail(`Error packing ${a}`)}catch(e){return n.fail(`Error packing ${a}`),void console.error(logSymbols.warning,e.message)}await generateCode(a,t,r),isPacking[a]=!1,shouldPackAgain[a]?(shouldPackAgain[a]=!1,n.warn("Needs repacking, something changed while packing..."),await pack(e,t)):n.succeed(`Done packing ${a}`)}const sane=require("sane"),logSymbols$1=require("log-symbols"),chalk$1=require("chalk"),{debounce:debounce}=require("throttle-debounce"),path$2=require("path");async function watch(e,t){for(const a of e)await watchDirectory(a,t)}async function watchDirectory(e,t){return new Promise(a=>{let r,o={};if(Array.isArray(e)?(r=e[0],o=e[1]):r=e,!0!==t.watch&&!0!==o.watch||!1===o.watch)return void a();const s=debounce(t.watchDelay,()=>{pack(e,t)}),n=sane(`${path$2.join(t.sourceDirectory,r)}`,{glob:["**/*.png","**/*.jpg"]});n.on("ready",()=>{console.log(logSymbols$1.info,chalk$1.blue(`Started watching ${r} with a delay of ${t.watchDelay/1e3}s`)),a()}),n.on("change",s),n.on("add",s),n.on("delete",s)})}const AssetFile="assets.json";async function main(e){const t=await readSettingsFrom(e),a=t.directories;delete t.directories,t&&a&&(await packAll(a,t),await watch(a,t))}function pack$1(e){main(e||AssetFile)}exports.pack=pack$1;
