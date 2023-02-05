var formdata = new FormData();
formdata.append("market", "KSE100");

var requestOptions = {
    method: 'POST',
    body: formdata,
    redirect: 'follow'
};

fetch("https://sarmaaya.pk/api_prod/3.0/indice_sector_stocks_contributors.php",
    requestOptions)
    .then(response => response.json())
    .then(
        data => {
            sunApiData(data);
        }
    ).catch(error =>
    console.log('error', error)
);

const sunApiData = (data) => {

    for (var i = 0; i < data.data.length; i++) {
        (data.data[i].stock_sector_name) = (data.data[i].stock_sector_name).substring(0, 10)

        delete data.data[i].weightage

    }

    const keys = {
        indice: "name",
        stock_sector_name: "name",
        data: "children",
        stocks: "children",
        stock_symbol: 'name',
        weightage: "value",
        stock_change_p: "points",
        sector_change: "points",
        market_change_p: "points",
        stock_volume_m: 'stock_volume',

    }

    for (let i = 0; i < data.data.length; i++) {
        let temp = 0
        for (let j = 0; j < data.data[i].stocks.length; j++) {
            temp += parseFloat(data.data[i].stocks[j].stock_change_p)
        }
        data.data[i].sector_change = temp.toString();
    }

    const rename = (value) => {
        if (!value || typeof value !== 'object') return value;
        if (Array.isArray(value)) return value.map(rename);
        return Object.fromEntries(Object
            .entries(value)
            .map(([k, v]) => [keys[k] || k, rename(v)])
        );
    }

    data = rename(data);

    chart = () => {
        marketName = data.name
        marketChange = data.points
        var color = d3.scaleOrdinal()


        const root = partition(data);

        root.each(d => d.current = d);

        const svg = d3.create("svg")
            .attr("viewBox", [0, 0, width, width])
            .style("font", "28px sans-serif")
            .style("fontWeight", "bold")

        const g = svg.append("g")
            .attr("transform", `translate(${width / 2},${width / 2})`)

        const path = g.append("g")
            .selectAll("path")
            .data(root.descendants().slice(1))
            .join("path")
            .attr('fill', function(d, i, value) {
                if (d.data.points == 0) {
                    return '#84C58'
                } else if (d.data.points < 0 && d.data.points > -2.5) {

                    return '#5C0808'
                } else if (d.data.points < -2.5 && d.data.points > -5) {

                    return '#A00C0C'
                } else if (d.data.points < -5 && d.data.points > -20) {

                    return '#DD2E2E'
                } else if (d.data.points > 0 && d.data.points < 2.5) {

                    return '#188518'
                } else if (d.data.points > 2.5 && d.data.points < 5) {
                    return '#519B57'
                } else if (d.data.points > 5 && d.data.points < 20) {
                    return '#63C668'
                } else if (d.data.points > 20) {
                    return '#2F912F'
                } else if (d.data.points < -20) {
                    return '#6C2020'
                }

            })
            .attr("fill-opacity", d => arcVisible(d.current) ? (d.value ? 1 : 1) : 1)
            .attr("d", d => arc(d.current))
            .text((d => d.data.value < 1.4 ? ' ' : d.data.name))

            .text((d => d.value < 1.4 ? ' ' : d.data.name))


        path.filter(d => d.children)
            .style("cursor", "pointer")
            .on("click", clicked);


        path.append("title")
            .text(d => `${d.ancestors().map(d => d.data.name)
                .reverse().join(">")}: ${parseFloat(d.data.points).toFixed(2)}\nMarketcap: Rs ${format(d.data.marketcap)} \nWeightage: ${parseFloat(d.value).toFixed(2)}%\nVolume: ${(d.data.stock_volume)}

                `)

        path.append("info")
            .text(d => `${d.ancestors().map(d => d.data.size).reverse().join("/")} \n${format(d.value)} `)

        const label = g.append("g")

            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none")
            .selectAll("text")
            .data(root.descendants().slice(1))
            .join("text")
            .attr("dy", "0.35em")
            .style("fill", "white")
            .attr("fill-opacity", d => +labelVisible(d.current))
            .text(d => d.data.name + '\n' + d.data.value)
            .attr("transform", d => labelTransform(d.current))
            .text((d => d.data.value < 1.4 ? ' ' : d.data.name))

            .text((d => d.value < 1.4 ? ' ' : d.data.name))

        const parent = g.append("circle")
            .datum(root)
            .attr("r", radius)
            .attr("fill", "red")
            .attr("pointer-events", "all")

            .on("click", clicked)

            .attr('fill', function(d, i, value) {
                if (d.data.points > 0) {
                    return '#2F912F'
                } else if ((d.data.points == 0)) {
                    return '#84C58'
                } else if ((d.data.points < 0)) {
                    return '#6C2020'
                }
            })

        const title = g.append("text")
            .text(`${marketName}: ${marketChange}%`)
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .style('font-size', '38px')
            .attr('fill', 'white')
            .style("font-weight", "bold")
            .style("cursor", "default")
        path.append("title")
            .text('points'

            )

        function clicked(event, p) {

            parent.datum(p.parent || root);

            root.each(d => d.target = {
                x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                y0: Math.max(0, d.y0 - p.depth),
                y1: Math.max(0, d.y1 - p.depth)
            })


            const t = g.transition().duration(800);

            path.transition(t)
                .tween("data", d => {
                    const i = d3.interpolate(d.current, d.target);
                    return t => d.current = i(t);
                })
                .filter(function(d) {
                    return +this.getAttribute("fill-opacity") || arcVisible(d.target);
                })
                .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 1 : 1) : 1)
                .attrTween("d", d => () => arc(d.current));

            label.filter(function(d) {
                return +this.getAttribute("fill-opacity") || labelVisible(d.target);
            }).transition(t)
                .attr("fill-opacity", d => +labelVisible(d.target))
                .attrTween("transform", d => () => labelTransform(d.current))

        }

        function arcVisible(d) {

            return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
        }

        function labelVisible(d) {

            return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
        }

        function labelTransform(d) {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2 * radius;
            return `rotate(${x - 90}) translate(${y}, 0) rotate(${x < 180 ? 0 : 180})`;
        }

        return svg.node();
    }

    partition = data => {
        const root = d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);
        return d3.partition()
            .size([2 * Math.PI, root.height + 1])
            (root);
    }


    format = d3.format(",d")
    width = 1300
    radius = width / 6
    arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius * 1.5)
        .innerRadius(d => d.y0 * radius)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))


    const svg = d3.select('#psx-sunburst').append(chart)

}
$(function() {
    $('[data-toggle="tooltip"]').tooltip()
})