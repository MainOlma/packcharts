import React, {Component} from "react";

import '../styles/App.css';
import '../styles/tooltip.css';

import Pack from "./Pack";
import Legend from "./Legend";

import * as d3 from "d3";

class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            externalData: null,
            columns: null,
            selectedColumns: {
                selectedRadio: "Type_1_1"
            }
        }
        this.handleFilterUpdate = this.handleFilterUpdate.bind(this)
        this.resize = this.resize.bind(this)
    }

    resize() {
        this.forceUpdate()
    }

    componentDidMount() {
        window.addEventListener('resize', this.resize)

        let prefix = 'src/data/'
        this._asyncRequest = Promise.all([
            d3.tsv(prefix + "data.csv"),
            d3.tsv(prefix + "data2.csv"),
            d3.tsv(prefix + "data3.csv"),
            d3.tsv(prefix + "data4.csv")
        ]).then(files => {
            this._asyncRequest = null;
            let columns = files[0].columns.filter(e => (e != "Id" && e != "color" && e != "node"))
            this.setState({
                externalData: files[0],
                data0: files[0],
                data1: files[1],
                data2: files[2],
                data3: files[3],
                columns: columns
            });
        }).catch(function (err) {
            // handle error here
            console.log(err)
        })
    }

    componentWillUnmount() {
        if (this._asyncRequest) {
            this._asyncRequest.cancel();
        }
    }

    handleFilterUpdate(filterValue) {
        this.setState({
            selectedColumns: filterValue
        });
    }

    render() {
        if (this.state.externalData === null) {
            // Render loading state ...
            //console.log("render")
            return <div>Loading...</div>
        } else {
            // Render real UI ...

            let
                w = window,
                d = document,
                documentElement = d.documentElement,
                body = d.getElementsByTagName('body')[0],
                window_width = w.innerWidth || documentElement.clientWidth || body.clientWidth,
                window_height = w.innerHeight || documentElement.clientHeight || body.clientHeight;

            return (
                <div>
                    <Legend column_names={this.state.columns} updateFilter={this.handleFilterUpdate}/>
                    <svg width={window_width - 50} height={window_height - 160} viewBox={'0 0 ' + 1343 + ' ' + 600}
                         preserveAspectRatio="xMidYMin meet">
                        <rect className='overlay' width={1343} height={600}/>
                        <g className='scheme'>
                            <Pack y={0} x={100} width={600} height={240} data={this.state.data0}
                                  column={this.state.selectedColumns.selectedRadio} title='Bubbles 1' id='bubb1'/>
                            <Pack y={0} x={600} width={600} height={240} data={this.state.data1}
                                  column={this.state.selectedColumns.selectedRadio} title='Bubbles 2'
                                  id='bubb2'/>
                            <Pack y={250} x={100} width={600} height={360} data={this.state.data2}
                                  column={this.state.selectedColumns.selectedRadio} title='Bubbles 3'
                                  id='bubb3'/>
                            <Pack y={250} x={600} width={600} height={360} data={this.state.data3}
                                  column={this.state.selectedColumns.selectedRadio} title='Bubbles 4'
                                  id='bubb4'/>
                        </g>
                    </svg>
                </div>
            );
        }
    }
}

export default App;