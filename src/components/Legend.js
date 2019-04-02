import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as d3 from 'd3';

class Legend extends Component {
    constructor(props) {
        super(props);
        this.handleMultiSelect = this.handleMultiSelect.bind(this);
        this.checkRadio = this.checkRadio.bind(this);
        this.state={tooltipData:null, selectedRadio: "Type_1_1"}
    }

    handleMultiSelect(event){
        const target = event.target;
        this.checkRadio(target, target.checked)
    }

    checkRadio(radio, value){
        radio.checked=value
        let radios = ReactDOM.findDOMNode(this).getElementsByTagName('input')
        for(var i=0, n=radios.length;i<n;i++) {
            radios[i].parentElement.classList.remove("radio_checked")
        }

        radio.parentElement.classList.add("radio_checked")

        this.setState({
            selectedRadio: radio.id
        });
    }


    componentDidMount() {
        this._asyncRequest = d3.tsv("src/data/tooltip.csv").then(
            externalData => {
                this._asyncRequest = null;
                this.setState({tooltipData:externalData});

                /*check first radio on load*/
                let radios = ReactDOM.findDOMNode(this).getElementsByTagName('input')
                this.checkRadio(radios[0], true)
            }
        );
    }

    componentWillUnmount() {
        if (this._asyncRequest) {
            this._asyncRequest.cancel();
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevState!=this.state){
            this.props.updateFilter(this.state);
        }
    }

    render() {
        if (this.state.tooltipData === null) {
            // Render loading state ...
            return<div>Loading</div>
        } else {
            let items_T = [], items_U = [], item
            let tooltips=this.state.tooltipData

            this.props.column_names.map((e, i) => {

                let tooltip=tooltips.find(d => d['Prototype Name']==e),
                    classTooltip = tooltip['Tooltip'] ? "tooltip is-tooltip-bottom is-tooltip-white button" : "button"

                tooltip['Tooltip'].length>30 ? classTooltip+=" is-tooltip-multiline" : false

                item =  <div key={i} className={classTooltip} data-tooltip={tooltip['Tooltip']}>
                            <input type="radio" id={e} name="e"
                                    onChange={this.handleMultiSelect}/>
                            <label htmlFor={e} >{e.replace("Type_1_", '').replace("Type_2_", '')}</label>
                        </div>

                e.includes("Type_1") ? items_T.push(item) : items_U.push(item)
            })
            return (
                <div className='legend'>

                    <div className='buttons'>
                        Type_1
                        {items_T}
                    </div>

                    <div className='buttons'>
                        Type_2
                        {items_U}
                    </div>

                </div>
            )
        }
    }
}
export default Legend;