import { height } from "@mui/system"
import React from "react"
class ReactAnimateImages extends React.Component {
    
    constructor(props){
        super()
        this.state = {
            images: props.images, 
            interval: 0, 
            framInterval: props.framInterval ? props.framInterval : 100, 
            activeImageIndex: props.activeImageIndex ? props.activeImageIndex : 1, 
            stopAfterFirstRound: props.stopAfterFirstRound ? props.stopAfterFirstRound : false,
            stopAfterEachRound: props.stopAfterEachRound ? props.stopAfterFirstRound : false, 
            className: props.className ? props.className : {},
            style: props.style ? props.style : {},
            id: props.id 
        }
        this.handleStop = this.handleStop.bind(this)
        this.handleStart = this.handleStart.bind(this)
    }

    componentDidMount() {
        this.animate(this.state.stopAfterFirstRound)
    }

    handleStart(){
        this.animate(this.state.stopAfterEachRound)
    }

    handleStop(){
        clearInterval(this.state.interval)
    }

    animate(is_stoping){
        clearInterval(this.state.interval)
        this.setState({
            interval: setInterval(()=>{
                var activeImageIndex = this.state.activeImageIndex
                if(activeImageIndex === this.state.images.length){
                    this.setState({activeImageIndex: 1})
                    if(is_stoping) clearInterval(this.state.interval);
                }
                else this.setState({activeImageIndex: activeImageIndex+1});
                
                return;
            }, this.state.framInterval)
        });
    }

    render() {
        const { activeImageIndex, images, className, style, id } = this.state
        let style2 = {...style};
        style2['object-fit']='cover';
        return (
            <img src={images[activeImageIndex-1]} alt="" className={className} style={style2} id={id}
            />
        )
    }
}

export default ReactAnimateImages
