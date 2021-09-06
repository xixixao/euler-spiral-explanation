export const TAU = 2 * Math.PI;

export function v(x, y = x) {
  return new Vector(x, y);
}

export function vp(angle, radius) {
  return Vector.polar(angle, radius);
}

// export function vGA(point) {
//   return Vector.fromGA(point);
// }

export class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(vec) {
    return new Vector(this.x + vec.x, this.y + vec.y);
  }

  subtract(vec) {
    return new Vector(this.x - vec.x, this.y - vec.y);
  }

  invert() {
    return new Vector(-this.x, -this.y);
  }

  multiply(scalar) {
    return new Vector(scalar * this.x, scalar * this.y);
  }

  multiplyVec(b) {
    return new Vector(this.x * b.x, this.y * b.y);
  }

  invertY() {
    return new Vector(this.x, -this.y);
  }

  divide(scalar) {
    if (scalar === 0) {
      throw new TypeError("Division by 0.");
    }
    return this.multiply(1 / scalar);
  }

  rotate(angle) {
    return new Vector(
      this.x * Math.cos(angle) - this.y * Math.sin(angle),
      this.x * Math.sin(angle) + this.y * Math.cos(angle)
    );
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }

  length() {
    return Math.sqrt(this.lengthSq());
  }

  /**
   * Returns a vector of the same direction but with a length of 1, or the given length.
   * @param  {number} [scalar=1] Length of returned vector.
   * @return {Vector}
   */
  normalize(scalar = 1) {
    let length = this.length();

    if (length === 0) {
      throw new TypeError("Vector has length 0. Cannot normalize().");
    }
    return this.divide(length).multiply(scalar);
  }

  mix(vec, amount = 0.5) {
    let x = (1 - amount) * this.x + amount * vec.x;
    let y = (1 - amount) * this.y + amount * vec.y;
    return new Vector(x, y);
  }

  left() {
    return new Vector(-this.y, this.x); // this is 90 degrees counter-clockwise
  }

  right() {
    return new Vector(this.y, -this.x); // this is 90 degrees clockwise
  }

  snap(snapTo) {
    let snap = function (val) {
      return Math.round(val / snapTo) * snapTo;
    };
    return new Vector(snap(this.x), snap(this.y));
  }

  /**
   * Expand this vector to a given minimum length in the same direction as the original.
   *
   * Not valid on zero-length vectors.
   *
   * @param  {number} scalar Minimum length
   * @return {Vector}
   */
  minLength(scalar) {
    return this.length() < scalar ? this.normalize(scalar) : this;
  }

  /**
   * Reduce this vector to a given maximum length in the same direction as the original.
   *
   * @param  {number} scalar Maximum length
   * @return {Vector}
   */
  maxLength(scalar) {
    return this.length() > scalar ? this.normalize(scalar) : this;
  }

  clone() {
    return new Vector(this.x, this.y);
  }

  dot(vec2) {
    return this.x * vec2.x + this.y * vec2.y;
  }

  projectOnto(vec2) {
    return vec2.multiply(this.dot(vec2) / vec2.lengthSq());
  }

  static polar(angle, size) {
    return new Vector(Math.cos(angle) * size, Math.sin(angle) * size);
  }

  angle() {
    return Math.atan2(this.y, this.x);
  }

  angleDeg() {
    return radian2degrees(this.angle());
  }

  slope() {
    return this.y / this.x;
  }

  toString() {
    return "x:" + this.x + ", y:" + this.y;
  }

  serialize() {
    return this.toArray();
  }

  static deserialize(seriliazed) {
    return Vector.fromArray(seriliazed);
  }

  toArray() {
    return [this.x, this.y];
  }

  // toGA() {
  //   return GA.point(this.x, this.y);
  // }

  // static fromGA(point) {
  //   const [x, y] = GAPoint.toTuple(point);
  //   return new Vector(x, y);
  // }

  toObject() {
    return { x: this.x, y: this.y };
  }

  equals(vec) {
    return this.x === vec.x && this.y === vec.y;
  }

  static fromArray(arr) {
    return new Vector(arr[0], arr[1]);
  }

  static fromObject(objLike) {
    return new Vector(obj.x, obj.y);
  }

  static fromString(str) {
    // e.g.  'x:100, y:200'
    let array = str
      .split(", ")
      .map(function (s) {
        return s.substring(2);
      })
      .map(parseFloat);

    if (array.some(isNaN)) {
      throw new TypeError('"' + str + '" is not a valid Vector string.');
    }

    return Vector.fromArray(array);
  }
}

const degrees = 180 / Math.PI;

export function radian2degrees(rad) {
  return rad * degrees;
}

export function degrees2radian(deg) {
  return deg / degrees;
}

export function taus(rad) {
  return Math.floor((rad / TAU) * 100) / 100;
}

export function orientedAngle(angle) {
  // return normalizeAngle((angle + (Math.sign(angle) * TAU) / 2) % (TAU / 2));
}

export function subtractAngles(a, b) {
  return normalizeAngle(b - a);
}

export function addAngles(a, b) {
  return normalizeAngle(a + b);
}

export function normalizeAngle(x) {
  return x + (x > TAU / 2 ? -TAU : x < -TAU / 2 ? TAU : 0);
}

export function areAnglesEqual(a, b) {
  return Math.abs(a - b) < 0.0000000001;
}
