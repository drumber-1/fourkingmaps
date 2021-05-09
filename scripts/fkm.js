function binarySearch(ar, el)
{
    var m = 0;
    var n = ar.length - 1;
    while (m <= n) {
        var k = (n + m) >> 1;
        if (el > ar[k]) {
            m = k + 1;
        } else if(el < ar[k]) {
            n = k - 1;
        } else {
            return k;
        }
    }
    return -1;
}

function modMultShuffle(x, a, m)
{
    // Potentially could get over 2^64, so need to do calculation in big boy numbers
    var x_big = new BigNumber(x);
    var ans = x_big.multiply(a).mod(m);
    return parseInt(ans.valueOf());
}

class Grid
{
    constructor(bounds, dimension)
    {
        this.bounds = bounds;
        this.dimension = dimension;
        this.range = L.latLng(bounds.getNorth() - bounds.getSouth(), bounds.getEast() - bounds.getWest());
    }

    cellToLatLng(cell)
    {
        var lat = this.bounds.getSouth() + (this.range.lat * cell.y / this.dimension.y);
        var lng = this.bounds.getWest() + (this.range.lng * cell.x / this.dimension.x);
        return L.latLng(lat, lng);
    }

    calcCellFrac(latLng)
    {
        return L.point(this.dimension.x * (latLng.lng - this.bounds.getWest()) / this.range.lng,
                    this.dimension.y * (latLng.lat - this.bounds.getSouth()) / this.range.lat);
    }

    calcCell2Coord(latLng)
    {
        var cellFrac = this.calcCellFrac(latLng);
        return L.point(Math.floor(cellFrac.x), Math.floor(cellFrac.y));
    }

    calcCell2CoordFrom1Coord(cell1Coord)
    {
        var y = Math.floor(cell1Coord / this.dimension.x);
        var x = cell1Coord % this.dimension.x;
        return L.point(x, y);
    }

    calcCell1Coord(latLng)
    {
        var cell2Coord = this.calcCell2Coord(latLng);
        return cell2Coord.y * this.dimension.x + cell2Coord.x;
    }

    calcCellBounds(point)
    {
        var cellFrac = this.calcCellFrac(point);
        var cellMin = this.calcCell2Coord(point);
        var cellMax = L.point(cellMin.x + 1, cellMin.y + 1);
        return L.latLngBounds(this.cellToLatLng(cellMin), this.cellToLatLng(cellMax));
    }
}

class WordGenerator
{
    constructor(grid, num_words, random_factor, inverse_random_factor)
    {
        this.grid = grid;
        this.num_words = num_words;
        this.scale1 = this.num_words;
        this.scale2 = this.num_words * this.num_words;
        this.scale3 = this.num_words * this.num_words * this.num_words;
        this.scale4 = this.num_words * this.num_words * this.num_words * this.num_words;
        this.random_factor = random_factor;
        this.inverse_random_factor = inverse_random_factor;
    }

    calcCell4Coord(latLng)
    {
        var cell1CoordNative = this.grid.calcCell1Coord(latLng);
        var cell1Coord = modMultShuffle(cell1CoordNative, this.random_factor, this.scale4)

        var remainder = cell1Coord
        var coord3 = Math.floor(remainder / this.scale3);
        remainder = remainder - (coord3 * this.scale3);
        var coord2 = Math.floor(remainder / this.scale2);
        remainder = remainder - (coord2 * this.scale2);
        var coord1 = Math.floor(remainder / this.scale1);
        remainder = remainder - (coord1 * this.scale1);
        var coord0 = remainder;
        return [coord0, coord1, coord2, coord3];
    }

    generateCoordString(latlng)
    {
        var cell4Coord = this.calcCell4Coord(latlng, )

        var str0 = this.getWord(cell4Coord[0])
        var str1 = this.getWord(cell4Coord[1])
        var str2 = this.getWord(cell4Coord[2])
        var str3 = this.getWord(cell4Coord[3])

        return str0.concat(".", str1, ".", str2, ".", str3);
    }

    getWord(coord)
    {
        return words[coord];
    }

    getCoord(word)
    {
        return binarySearch(words, word);
    }

    getLatLng(word0, word1, word2, word3)
    {
        var coord0 = this.getCoord(word0);
        var coord1 = this.getCoord(word1);
        var coord2 = this.getCoord(word2);
        var coord3 = this.getCoord(word3);

        // One of the words not found
        if (coord0 < 0 || coord1 < 0 || coord2 < 0 || coord3 < 0)
            return null;

        // One of the words outside the grid bounds
        if (coord0 >= this.scale1 || coord1 >= this.scale1 || coord2 >= this.scale1 || coord3 >= this.scale1)
            return null;

        var cell1Coord = coord0
                       + (coord1 * this.scale1)
                       + (coord2 * this.scale2)
                       + (coord3 * this.scale3);

        var cell1CoordNative = modMultShuffle(cell1Coord, this.inverse_random_factor, this.scale4);
        var cell2Coord = this.grid.calcCell2CoordFrom1Coord(cell1CoordNative);

        return this.grid.cellToLatLng(cell2Coord.add(L.point(0.5,0.5)));
    }
}