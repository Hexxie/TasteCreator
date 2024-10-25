Promise.all([
  d3.json("data/nutriforge.json"),
  d3.json("data/translations.json")]).then(([data, translations]) => {

  let height = 500;
  let width = 1000;

  const nodes = Array.from(new Set(data.links.flatMap(link => [link.source, link.target])))
            .map(id => ({ id }));

  let currentNode = null;
  let currentNodes = [];

  let totalFlavors = { bitter: 0, salty: 0, sour: 0, sweet: 0, umami: 0 };
  let nodeFlavors = {};

  const flavorNames = {
    bitter: "Гіркий",
    salty: "Солоний",
    sour: "Кислий",
    sweet: "Солодкий",
    umami: "Пряний"
};

function updateTasteList() {
  d3.select("#taste-list").selectAll("li").remove();
  
  d3.select("#taste-list")
      .selectAll("li")
      .data(Object.entries(totalFlavors).filter(([key, value]) => value > 0))
      .enter()
      .append("li")
      .text(([key, value]) => `${flavorNames[key]}: ${value}`);
}

  function addCurrentNode(currentNode) {
    const index = currentNodes.indexOf(currentNode);
    if (index === -1) {
      currentNodes.push(currentNode);
    }
    // This line to add a new item into the recipe (TODO)
    d3.select("#recipe-list").selectAll("li").data(currentNodes, d => d).enter().append("li").text(d => d);

    // This line to fetch taste from  the python (TODO)
    if (nodeFlavors[currentNode]) {
      // Додаємо значення з уже збережених смаків
      Object.keys(nodeFlavors[currentNode]).forEach(key => {
          totalFlavors[key] += nodeFlavors[currentNode][key];
      });
      updateTasteList();
  } else {
      const url = `http://127.0.0.1:8000/get_flavors?product=${translations[currentNode]}`;
      console.log(url)
      fetch(url)
          .then(response => response.json())
          .then(flavors => {
              console.log('Flavor Count:', flavors);

              // Зберігаємо отримані смакі для вузла в nodeFlavors
              nodeFlavors[currentNode] = flavors;

              // Додаємо значення смаків до totalFlavors
              Object.keys(flavors).forEach(key => {
                  totalFlavors[key] += flavors[key];
              });

              updateTasteList();
          })
          .catch(error => {
              console.error('Error fetching data:', error);
          });
        }

    console.log(currentNodes);
    updateGraph(currentNodes);
  }

  function removeCurrentNode(currentNode) {
    const index = currentNodes.indexOf(currentNode);
    if (index !== -1) {
      currentNodes.splice(index, 1);

      if (nodeFlavors[currentNode]) {
        Object.keys(nodeFlavors[currentNode]).forEach(key => {
            totalFlavors[key] -= nodeFlavors[currentNode][key];
        });
        updateTasteList();
    }
    }
    console.log(currentNodes);
  }

  //Search of the product and highlight it on graph
  d3.select("#search-btn").on("click", function() {
    currentNode = d3.select("#input-box").property("value");
    console.log(currentNode)
    highlightCurrentNode(currentNode);
    addCurrentNode(currentNode);

    d3.select("#input-box").property("value", "");
  });

  var node = d3.select("svg").selectAll("circle")
                              .data(nodes).enter()
                              .append("circle")
                              .attr("r", 12)
                              .classed("node", true)
                              .classed("fixed", d => d.fx != undefined)
                              .on("mouseover", function (event, d) {
                                  // Збільшуємо розмір при наведенні
                                  d3.select(this).transition()
                                    .duration(200)
                                    .attr("r", 15); // Новий радіус

                                    d3.select(`#label-${d.id.replace(/\s+/g, "_")}`).style("visibility", "visible");
                                })
                                .on("mouseout", function (event, d) {
                                  // Повертаємо початковий розмір при відведенні миші
                                  d3.select(this).transition()
                                    .duration(200)
                                    .attr("r", 12); // Початковий радіус
                                    if (!d.fx) {
                                      d3.select(`#label-${d.id.replace(/\s+/g, "_")}`).style("visibility", "hidden");
                                    }
                                  });

  var link = d3.select("svg").selectAll("line")
                              .data(data.links)
                              .enter()
                              .append("line")
                              .attr("stroke", "orange")
                              .classed("link", true)

    // Додавання тексту для нодів
  var labels = d3.select("svg").selectAll(".label")
                              .data(nodes).enter()
                              .append("text")
                              .attr("class", "label")
                              .attr("id", d => `label-${d.id.replace(/\s+/g, "_")}`)
                              .attr("x", d => (d.x !== undefined ? d.x + 15 : 0))
                              .attr("y", d => (d.y !== undefined ? d.y - 15 : 0))
                              .text(d => {
                              //  console.log(d.id);
                                return d.id;
                              })
                              .style("visibility", d => currentNodes.map(node => node.trim()).includes(d.id.trim()) ? "visible" : "hidden");

  node.raise();
  labels.raise();

  const simulation = d3.forceSimulation(nodes)
                      .force("link", d3.forceLink(data.links).id(d => d.id)) 
                      .force("charge", d3.forceManyBody())
                      .force("center", d3.forceCenter(500, 250))
                      .on("tick", ticked);
                    
  const drag = d3.drag()
                  .on("start", dragstart)
                  .on("drag", dragged);

  node.call(drag).on("click", click);

  function ticked() {
    node
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);

    labels
    .attr("x", d => d.x + 15)
    .attr("y", d => d.y - 15);

      link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

  }
  function click(event, d) {
    // Якщо вузол вже фіксований, то розфіксовуємо його
    currentNode = d.id;

    if (d.fx !== undefined) {
      delete d.fx;
      delete d.fy;
      d3.select(this).classed("fixed", false);
      d3.select(`#label-${d.id.replace(/\s+/g, "_")}`).style("visibility", "hidden"); // Приховуємо текст при розфіксації
      removeCurrentNode(currentNode);
    } else {
      // Якщо не фіксований, фіксуємо його на поточній позиції
      d.fx = d.x;
      d.fy = d.y;
      d3.select(this).classed("fixed", true);
      d3.select(`#label-${d.id.replace(/\s+/g, "_")}`).style("visibility", "visible"); // Залишаємо текст видимим
      addCurrentNode(currentNode);
    }
    simulation.alpha(1).restart();
  }

  function dragstart() {
    d3.select(this).classed("fixed", true);
  }

  function clamp(x, lo, hi) {
    return x < lo ? lo : x > hi ? hi : x;
  }

  function dragged(event, d) {
    d.fx = clamp(event.x, 0, width);
    d.fy = clamp(event.y, 0, height);
    simulation.alpha(1).restart();
  }


  function highlightCurrentNode(currentNode) {                                  
    d3.selectAll("circle")
      .filter(d => d.id === currentNode)
      .classed("fixed", true);
  
    d3.select(`#label-${currentNode.replace(/\s+/g, "_")}`)
      .style("visibility", "visible");
  }
  
  function updateGraph(currentNodes) {
    // Фільтруємо зв'язки, які мають source або target у selectedNodes
    const filteredLinks = data.links.filter(link => 
      currentNodes.includes(link.source.id) || currentNodes.includes(link.target.id)
    );
    console.log(filteredLinks)
    console.log(link.source)
    console.log(link.target)
    console.log(currentNodes)
  
    // Створюємо множину всіх вузлів, які з'єднані з вузлами у selectedNodes
    const connectedNodes = new Set(filteredLinks.flatMap(link => [link.source.id, link.target.id]));
    console.log(connectedNodes)
  
    // Додаємо обрані вузли до connectedNodes, щоб вони залишалися видимими
    nodes.forEach(nodeId => connectedNodes.add(nodeId));
  
    // Оновлюємо видимість вузлів
    node
      .style("opacity", d => connectedNodes.has(d.id) ? 1 : 0); // Приховуємо не пов'язані вузли
  
    // Оновлюємо видимість зв'язків
    link
      .style("opacity", d => (currentNodes.includes(d.source.id) || currentNodes.includes(d.target.id)) ? 1 : 0);
  }

});