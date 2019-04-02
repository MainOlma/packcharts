import React, {Component} from "react";
import * as d3 from 'd3';

let active = d3.select(null)

class Pack extends Component {

    constructor(props) {
        super(props);
        this.staticXY = []
        this.tooltip = d3.select(null)
        this.myRef = React.createRef();
        this.updateStyleAndAttrs = this.updateStyleAndAttrs.bind(this)
        this.render = this.render.bind(this)
    }

    componentDidMount() {
        let svg = d3.select(this.myRef.current),
            width = +svg.attr("width"),
            height = +svg.attr("height");

        const data = this.props.data

        let
            vLayout = d3.pack().padding(1).size([width, height]),
            scheme_id = this.props.id,

            maxdata = data.map(d => {
                let d_arr = Object.values(d),
                    arr = d_arr.slice(3).map(e => parseFloat(e)),
                    max = Math.max.apply(null, arr)
                return {id: d.Id, name: d.node, max: max}
            })

        maxdata.sort((a, b) => b.max - a.max)

        var scale = d3.scaleLinear()
            .domain([0, 750])
            .range([2, 100]);

        let dataWithRoot = {name: 'root', children: maxdata}

        let vRoot = d3.hierarchy(dataWithRoot)
            .sum((d) => d.max)

        vLayout.radius(d => {
            return scale(Math.sqrt(d.data.max));
        })(vRoot)

        let vld = vRoot.descendants()

        let startingPos = Object.values(vld)
        startingPos.map(e => {
            this.staticXY.push({key: scheme_id + e.data.name, valueX: e.x, valueY: e.y, R: e.r})
        })

        let maxcont = svg.append("g").attr("class", "pack_container_max")

        let node = maxcont.selectAll("g")
            .data(vld);

        let circles = node.enter()
            .append("g")
            .merge(node)
            .each(function (d) {
                drawCircle(this, d.r);
                d.node = this;
            })

        node.exit().remove()
        maxcont.append("text").attr("class", "title").text(this.props.title).attr("x", width / 2).attr("y", 20)

        circles
            .attr("transform", d => {
                let currentX, currentY,
                    current = this.staticXY.find(e => e.key == (scheme_id + d.data.node))
                if (current) {
                    currentX = this.staticXY.find(e => e.key == (scheme_id + d.data.node)).valueX
                    currentY = this.staticXY.find(e => e.key == (scheme_id + d.data.node)).valueY
                } else {
                    currentX = d.x
                    currentY = d.y
                }
                return "translate(" + currentX + "," + currentY + ")";
            })

        function drawCircle(circle, rad) {
            let cir = d3.select(circle).selectAll("circle").data([rad])
            cir.enter().append("circle")
                .merge(cir)
                .attr("r", rad)
        }

        this.tooltip = d3.select('div.circle_tooltip')
            .attr('class', 'hidden circle_tooltip');
    }

    componentDidUpdate() {
        this.updateStyleAndAttrs()
    }


    updateStyleAndAttrs() {
        let svg = d3.select(this.myRef.current)
        svg.attr("transform", "translate(" + this.props.x + "," + this.props.y + ")")

        let scheme_id = this.props.id

        var scale = d3.scaleLinear()
            .domain([0, 750])
            .range([2, 100]);

        let container = svg.selectAll('g.pack_container').data(['']);
        container.enter()
            .append('g')
            .merge(container)
            .attr("class", "pack_container")
        container.exit().remove()

        let column = this.props.column
        const data = this.props.data

        let colors = {}
        data.map(d => {
            let name = d.node
            let row = getRow(data, name)
            if (row) {
                let median = d3.median(row),
                    std = d3.deviation(row),
                    avge = d3.mean(row),
                    domain = [median - 2 * std, median + 2 * std]/*[avge-3*std,avge+3*std]*/

                const min = d3.min(row)
                const max = domain[1]
                let color = d3.scaleLinear()
                    .domain([min, min + (median - min) / 2, median, median + (max - median) / 2, max])
                    .range(["#8B1FDD", "#6B5BD8", "#478BEC", "#F7AC3A", "#D4322E"])
                    .clamp(true)
                    .interpolate(d3.interpolateHcl);
                colors[name] = color
            }
        })

        function getRow(data, name) {
            let row = "", arr
            if (data.find(e => e.node === name)) {
                row = data.find(e => e.node === name)
                let d_arr = Object.values(row)
                arr = d_arr.slice(3).map(e => +e)
            }
            return arr
        }

        let vNodes = data

        d3.select(".overlay")
            .on("click", unZoom)

        /*let simulation = d3.forceSimulation(vNodes)
            .force("attach", d3.forceManyBody().strength(5).distanceMin(2))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().strength(1).radius(function (d) {
                return scale(Math.sqrt(d[column])) + 1;
            }))
            .alphaDecay(0.04)
            .stop()
        for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
            simulation.tick();
        }*/

        let node = container.selectAll("g")
            .data(vNodes);

        let circles = node.enter()
            .append("g")
            .merge(node)
            .attr("id", function (d) {
                return "node-" + d.Id;
            })
            .style("stroke", "black")
            .attr("class", function (d) {
                return "node" + (!d.children ? " node--leaf" : d.depth ? "" : " node--root");
            })
            .each(function (d) {
                d.node_link = this;
                d.r = scale(Math.sqrt(d[column]));
                addCircle(this, d[column], d.node, scale(Math.sqrt(d[column])));
            })
            .on("mouseover", hovered(true, this.tooltip))
            .on("mouseout", hovered(false, this.tooltip))
            .on("click", transZoom)

        node.exit().remove()


        circles
            .attr("transform", (d, i) => {
                let currentX, currentY,
                    current = this.staticXY.find(e => e.key == (scheme_id + d.node))
                if (current) {
                    currentX = this.staticXY.find(e => e.key == (scheme_id + d.node)).valueX
                    currentY = this.staticXY.find(e => e.key == (scheme_id + d.node)).valueY
                } else {
                    console.log("not found", scheme_id, i)
                    currentX = 0
                    currentY = 0
                }
                return "translate(" + currentX + "," + currentY + ")";
            })


        function addCircle(circle, value, title, rad) {
            let cir = d3.select(circle).selectAll("circle").data([rad])
            cir.enter().append("circle")
                .merge(cir)
                .transition().duration(500)
                .attr("r", rad)
                .style("fill", colors[title](value))
                .style("stroke", d3.rgb(colors[title](value)).darker(0.5));
            let visibility = null
            if (d3.select(circle).select("text.circle_label").node())
                visibility = d3.select(circle).select("text.circle_label").attr('visibility')

            d3.select(circle).selectAll("text").remove()
            d3.select(circle).append("text")/*.text(title + " : " + value)*/
                .attr('class', 'circle_label')
                .each(d => d.r = scale(Math.sqrt(value)))
                .style("fill-opacity", 1)
                .attr("fill", invertColor(d3.color(colors[title](value)).hex(), 1))
                .append("tspan").attr("x", 0).attr("dy", "-0.25em").text(title.replace("Component", 'Cmp'))
                .append("tspan").attr("x", 0).attr("dy", "1em").text(d3.format(",")(value).replace(',', ' '))

            let sc = 1
            if (d3.select('.scheme').attr('transform'))
                sc = getTranslation(d3.select('.scheme').attr('transform'))[2]

            d3.select(circle).selectAll("text.circle_label")
                .attr('transform', 'scale(' + (1 / sc) + ')')
                .transition().duration(1000)
                .attr('visibility', (d, i, elements) => {
                    const el = d3.select(elements[i]).node(),
                        labelBox = el.getBBox(),
                        r = d.r,
                        size = Math.sqrt(labelBox.width / sc * labelBox.width / sc + labelBox.height / sc * labelBox.height / sc);
                    /* smooth apearing */
                    (size < 1.9 * r && visibility) ? d3.select(el).style("opacity", 0).transition().duration(1000).style("opacity", 1) : null
                    return (size < 1.9 * r) ? null : 'hidden';
                })
        }

        function invertColor(hex, bw) {
            if (hex.indexOf('#') === 0) {
                hex = hex.slice(1);
            }
            // convert 3-digit hex to 6-digits.
            if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }
            if (hex.length !== 6) {
                throw new Error('Invalid HEX color.');
            }
            var r = parseInt(hex.slice(0, 2), 16),
                g = parseInt(hex.slice(2, 4), 16),
                b = parseInt(hex.slice(4, 6), 16);
            if (bw) {
                return (r * 0.299 + g * 0.587 + b * 0.114) > 186
                    ? '#000000'
                    : '#FFFFFF';
            }
        }

        function hovered(hover, tooltip) {
            return function (d) {
                d3.selectAll(this).classed("node--hover", hover);

                tooltip.classed('hidden', !hover)
                    .attr('style', 'left:' + (d3.event.pageX + 10) + 'px; top:' + (d3.event.pageY - 20) + 'px')
                    .html(d.node + ': ' + d3.format(",")(d[column]).replace(',', ' '));
            };
        }

        function unZoom() {
            d3.select("svg").attr("class", "unzoomed")
            active.classed("active", false);
            active = d3.select(null);

            d3.select("svg g.scheme")
                .transition()
                .duration(700)
                .attr("transform", "translate(0,0)scale(1)");

            d3.selectAll('text.circle_label')
                .transition()
                .attr('transform', 'scale(1)')
                .attr('visibility', (d, i, elements) => {
                    let sc = 1
                    const el = d3.select(elements[i]).node()
                    const labelBox = el.getBBox();
                    const r = d.r;
                    const size = Math.sqrt(labelBox.width / sc * labelBox.width / sc + labelBox.height / sc * labelBox.height / sc)
                    return (size < 1.9 * r) ? null : 'hidden';
                })
        }

        function getTranslation(transform) {
            var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttributeNS(null, "transform", transform);
            var matrix = g.transform.baseVal.consolidate().matrix;
            return [matrix.e, matrix.f, matrix.a];
        }

        function transZoom(data) {
            if (active.node() === this) return unZoom();
            active.classed("active", false);
            active = d3.select(this).classed("active", true);

            let current_group = d3.select(data.node_link.parentNode.parentNode).node().getBBox(),
                main_svg = d3.select("#root svg"),
                width = main_svg.attr("width"),
                height = main_svg.attr("height")

            let g_x = getTranslation(svg.attr("transform"))[0],
                g_y = getTranslation(d3.select(data.node_link.parentNode.parentNode).attr("transform"))[1],

                dx = current_group.width,
                dy = current_group.height,
                x = g_x + current_group.x + dx / 2,
                y = g_y + current_group.y + dy / 2,
                sc = 0.9 / Math.max(dx / width, dy / height),
                translate = [width / 2 - sc * x, height / 2 - sc * y];

            d3.select("svg").attr("class", "zoomed")

            d3.select("svg g.scheme")
                .transition()
                .duration(700)
                .attr("transform", "translate(" + translate + ") scale(" + sc + ")");

            d3.selectAll("text.circle_label")
                .attr('transform', 'scale(' + (1 / sc) + ')')
                .transition().duration(500)
                .attr('visibility', (d, i, elements) => {
                    const el = d3.select(elements[i]).node()
                    const labelBox = el.getBBox();
                    const r = d.r;
                    const size = Math.sqrt(labelBox.width / sc * labelBox.width / sc + labelBox.height / sc * labelBox.height / sc);

                    /*smooth visibility*/
                    const visibility = d3.select(el).attr("visibility")
                    if (size < 1.9 * r && visibility)
                        d3.select(el).style("opacity", 0).transition().duration(500).style("opacity", 1)

                    return (size < 1.9 * r) ? null : 'hidden';
                })
        }
    }

    render() {
        return (
            <g className='pack' transform={'translate(' + this.props.x + ',' + this.props.y + ')'}
               width={this.props.width} height={this.props.height}
               ref={this.myRef}>
            </g>
        );
    }
}

export default Pack;